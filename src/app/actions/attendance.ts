"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { th } from "@/lib/i18n";
import { isWithinGeofence, distanceInMeters } from "@/lib/utils";
import { parseBangkokLocalDateTime } from "@/lib/timezone";
import type { Site } from "@/types/database";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

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
      const distance =
        site.latitude != null && site.longitude != null
          ? Math.round(distanceInMeters(lat, lng, site.latitude, site.longitude))
          : null;
      return {
        error: th.geofenceError(site.geofence_radius_m, site.name, distance),
      };
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

export async function checkOut(
  lat?: number,
  lng?: number,
  photoDataUrl?: string,
  normalHours?: number,
  overtimeHours?: number
) {
  if (!photoDataUrl) return { error: th.photoRequired };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: th.notAuthenticated };

  // Prefer the most recent open shift. `.maybeSingle()` errors when a staff
  // member somehow has two open rows, which then looked like "not checked in"
  // and blocked checkout entirely.
  const { data: openSessions, error: openError } = await supabase
    .from("attendance")
    .select("id, check_in_at")
    .eq("staff_id", user.id)
    .is("check_out_at", null)
    .order("check_in_at", { ascending: false })
    .limit(1);

  if (openError) return { error: openError.message };

  const openSession = openSessions?.[0];
  if (!openSession) return { error: th.notCheckedIn };

  const checkOutAt = new Date();
  const totalHours = Math.max(
    0,
    (checkOutAt.getTime() - new Date(openSession.check_in_at).getTime()) / 3600000
  );

  // Staff declare a Normal/OT split, but we always normalize it to the
  // exact elapsed total at check-out time. That way a few seconds of GPS
  // delay (or floating-point rounding) can never block checkout.
  let normal = Number(normalHours);
  let ot = Number(overtimeHours);
  if (!Number.isFinite(normal) || !Number.isFinite(ot) || normal < 0 || ot < 0) {
    normal = totalHours;
    ot = 0;
  }
  const declared = normal + ot;
  if (declared <= 0) {
    normal = totalHours;
    ot = 0;
  } else {
    normal = (normal / declared) * totalHours;
    ot = totalHours - normal;
  }
  normal = Math.round(normal * 100) / 100;
  ot = Math.round(ot * 100) / 100;
  // Fix any 0.01 rounding drift so Normal + OT still equals the rounded total.
  const roundedTotal = Math.round(totalHours * 100) / 100;
  ot = Math.round((roundedTotal - normal) * 100) / 100;
  if (ot < 0) {
    ot = 0;
    normal = roundedTotal;
  }

  const photoPath = await uploadCheckPhoto(supabase, user.id, photoDataUrl, "out");

  const { error } = await supabase
    .from("attendance")
    .update({
      check_out_at: checkOutAt.toISOString(),
      check_out_lat: lat ?? null,
      check_out_lng: lng ?? null,
      check_out_photo_path: photoPath,
      normal_hours: normal,
      overtime_hours: ot,
    })
    .eq("id", openSession.id);

  if (error) {
    // Most common cause right after deploying the OT split: the new columns
    // haven't been added in Supabase yet. Fall back to a plain checkout so
    // staff aren't stuck, and log clearly for the admin.
    const missingColumn =
      /normal_hours|overtime_hours|schema cache/i.test(error.message);
    if (missingColumn) {
      console.error(
        "Checkout: normal_hours/overtime_hours columns missing — run migration 009. Falling back without OT split.",
        error.message
      );
      const { error: fallbackError } = await supabase
        .from("attendance")
        .update({
          check_out_at: checkOutAt.toISOString(),
          check_out_lat: lat ?? null,
          check_out_lng: lng ?? null,
          check_out_photo_path: photoPath,
        })
        .eq("id", openSession.id);
      if (fallbackError) return { error: fallbackError.message };
    } else {
      return { error: error.message };
    }
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/history");
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
  // <input type="datetime-local"> submits a naive "YYYY-MM-DDTHH:mm" string
  // with no timezone info — staff are picking a time on the Thai wall
  // clock, so it must be parsed as Bangkok time, not left for Postgres to
  // default to UTC (which would silently shift it by 7 hours).
  const requestedCheckIn = parseBangkokLocalDateTime(
    formData.get("requested_check_in") as string
  );
  const requestedCheckOut = parseBangkokLocalDateTime(
    formData.get("requested_check_out") as string
  );

  if (!attendanceId || !reason?.trim()) {
    return { error: th.attendanceReasonRequired };
  }

  const { error } = await supabase.from("correction_requests").insert({
    attendance_id: attendanceId,
    requested_by: user.id,
    reason: reason.trim(),
    requested_check_in: requestedCheckIn,
    requested_check_out: requestedCheckOut,
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
