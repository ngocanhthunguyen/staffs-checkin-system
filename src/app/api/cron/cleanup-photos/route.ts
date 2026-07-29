import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "checkin-photos";
const RETENTION_DAYS = Number(process.env.PHOTO_RETENTION_DAYS ?? 90);
const BATCH_SIZE = 200;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  const { data: records, error: fetchError } = await supabase
    .from("attendance")
    .select("id, check_in_photo_path, check_out_photo_path")
    .lt("check_in_at", cutoff.toISOString())
    .or("check_in_photo_path.not.is.null,check_out_photo_path.not.is.null");

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const rows = records ?? [];
  const paths = rows.flatMap((r) =>
    [r.check_in_photo_path, r.check_out_photo_path].filter((p): p is string => !!p)
  );

  let deletedPhotos = 0;
  for (let i = 0; i < paths.length; i += BATCH_SIZE) {
    const batch = paths.slice(i, i + BATCH_SIZE);
    const { error: removeError } = await supabase.storage.from(BUCKET).remove(batch);
    if (removeError) {
      return NextResponse.json(
        { error: removeError.message, deletedPhotos, totalFound: paths.length },
        { status: 500 }
      );
    }
    deletedPhotos += batch.length;
  }

  const ids = rows.map((r) => r.id);
  if (ids.length > 0) {
    const { error: updateError } = await supabase
      .from("attendance")
      .update({ check_in_photo_path: null, check_out_photo_path: null })
      .in("id", ids);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message, deletedPhotos },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    retentionDays: RETENTION_DAYS,
    recordsCleared: ids.length,
    photosDeleted: deletedPhotos,
    ranAt: new Date().toISOString(),
  });
}
