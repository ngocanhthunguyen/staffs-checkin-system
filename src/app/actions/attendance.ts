"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { th } from "@/lib/i18n";
import { isWithinGeofence, isAllowedIp } from "@/lib/utils";
import type { Site } from "@/types/database";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Best-effort public IP of the current request (works on Vercel). */
async function getClientIp(): Promise<string | null> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? null;
  return headerList.get("x-real-ip");
}

async function uploadCheckPhoto(
  supabase: SupabaseServerClient,
  staffId: string,
  photoDataUrl: string,
  kind: "in" | "out"
): Promise<string | null> {
  const match = photoDataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return null;

  const [, ext, base64] = match;
  const buffer = Buffer.from(base64, "base64");
  const path = `${staffId}/${Date.now()}-${kind}.${ext === "jpeg" ? "jpg" : ext}`;

  const { error } = await supabase.storage
    .from("checkin-photos")
    .upload(path, buffer, { contentType: `image/${ext}`, upsert: false });

  if (error) {
    console.error("Photo upload failed:", error.message);
    return null;
  }

  return path;
}

export async function checkIn(lat?: number, lng?: number, photoDataUrl?: string) {
  if (!photoDataUrl) return { error: th.photoRequired };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: th.notAuthenticated };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, sites(*)")
    .eq("id", user.id)
    .single();

  if (!profile?.is_active) return { error: th.accountInactive };

  const { data: openSession } = await supabase
    .from("attendance")
    .select("id")
    .eq("staff_id", user.id)
    .is("check_out_at", null)
    .maybeSingle();

  if (openSession) return { error: th.alreadyCheckedIn };

  const site = profile.sites as Site | null;
  if (site && lat != null && lng != null) {
    if (!isWithinGeofence(lat, lng, site)) {
      return {
        error: th.geofenceError(site.geofence_radius_m, site.name),
      };
    }
  }

  if (site) {
    const clientIp = await getClientIp();
    if (!isAllowedIp(clientIp, site)) {
      return { error: th.networkError };
    }
  }

  const photoPath = await uploadCheckPhoto(supabase, user.id, photoDataUrl, "in");

  const { error } = await supabase.from("attendance").insert({
    staff_id: user.id,
    site_id: profile.site_id,
    check_in_lat: lat ?? null,
    check_in_lng: lng ?? null,
    check_in_photo_path: photoPath,
  });

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function checkOut(lat?: number, lng?: number, photoDataUrl?: string) {
  if (!photoDataUrl) return { error: th.photoRequired };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: th.notAuthenticated };

  const { data: openSession } = await supabase
    .from("attendance")
    .select("id")
    .eq("staff_id", user.id)
    .is("check_out_at", null)
    .maybeSingle();

  if (!openSession) return { error: th.notCheckedIn };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, sites(*)")
    .eq("id", user.id)
    .single();

  const site = (profile?.sites as Site | null) ?? null;
  if (site) {
    const clientIp = await getClientIp();
    if (!isAllowedIp(clientIp, site)) {
      return { error: th.networkError };
    }
  }

  const photoPath = await uploadCheckPhoto(supabase, user.id, photoDataUrl, "out");

  const { error } = await supabase
    .from("attendance")
    .update({
      check_out_at: new Date().toISOString(),
      check_out_lat: lat ?? null,
      check_out_lng: lng ?? null,
      check_out_photo_path: photoPath,
    })
    .eq("id", openSession.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function requestCorrection(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: th.notAuthenticated };

  const attendanceId = formData.get("attendance_id") as string;
  const reason = formData.get("reason") as string;
  const requestedCheckIn = formData.get("requested_check_in") as string;
  const requestedCheckOut = formData.get("requested_check_out") as string;

  if (!attendanceId || !reason?.trim()) {
    return { error: th.attendanceReasonRequired };
  }

  const { error } = await supabase.from("correction_requests").insert({
    attendance_id: attendanceId,
    requested_by: user.id,
    reason: reason.trim(),
    requested_check_in: requestedCheckIn || null,
    requested_check_out: requestedCheckOut || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/corrections");
  return { success: true };
}

export async function reviewCorrection(
  requestId: string,
  status: "approved" | "rejected",
  reviewNotes?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: th.notAuthenticated };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["manager", "admin"].includes(profile.role)) {
    return { error: th.unauthorized };
  }

  const { data: request } = await supabase
    .from("correction_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!request) return { error: th.requestNotFound };

  const { error: updateError } = await supabase
    .from("correction_requests")
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes ?? null,
    })
    .eq("id", requestId);

  if (updateError) return { error: updateError.message };

  if (status === "approved") {
    const updates: Record<string, string> = {};
    if (request.requested_check_in) updates.check_in_at = request.requested_check_in;
    if (request.requested_check_out) updates.check_out_at = request.requested_check_out;

    if (Object.keys(updates).length > 0) {
      await supabase.from("attendance").update(updates).eq("id", request.attendance_id);
    }
  }

  revalidatePath("/corrections");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
}
