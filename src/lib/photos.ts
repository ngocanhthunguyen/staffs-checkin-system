import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "checkin-photos";
const SIGNED_URL_TTL_SECONDS = 300;

export async function getSignedPhotoUrl(
  supabase: SupabaseClient,
  path: string | null | undefined
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function attachSignedPhotoUrls<
  T extends { check_in_photo_path?: string | null; check_out_photo_path?: string | null }
>(supabase: SupabaseClient, records: T[]) {
  return Promise.all(
    records.map(async (record) => ({
      ...record,
      checkInPhotoUrl: await getSignedPhotoUrl(supabase, record.check_in_photo_path),
      checkOutPhotoUrl: await getSignedPhotoUrl(supabase, record.check_out_photo_path),
    }))
  );
}
