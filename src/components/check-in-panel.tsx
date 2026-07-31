"use client";

import { useState, useTransition } from "react";
import { MapPin, Loader2, ShieldCheck } from "lucide-react";
import { checkIn, checkOut } from "@/app/actions/attendance";
import { th } from "@/lib/i18n";
import { formatDuration, formatTime, formatTodayHeader, getCurrentPosition, getHoursBetween } from "@/lib/utils";
import { PhotoCapture } from "@/components/photo-capture";
import type { Attendance, Site } from "@/types/database";

export function CheckInPanel({
  openAttendance,
  site,
}: {
  openAttendance: Attendance | null;
  site: Site | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isCheckedIn = !!openAttendance;

  const hoursToday = openAttendance
    ? getHoursBetween(openAttendance.check_in_at, openAttendance.check_out_at)
    : 0;

  async function handleAction(action: "in" | "out") {
    setError(null);

    if (!photoDataUrl) {
      setError(th.photoRequired);
      return;
    }

    startTransition(async () => {
      let lat: number | undefined;
      let lng: number | undefined;
      const needsLocation = site?.latitude != null && site?.longitude != null;

      if (needsLocation) {
        try {
          const position = await getCurrentPosition();
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch {
          if (action === "in") {
            // Check-in enforces the office geofence server-side, so without
            // a GPS fix we can't verify that — stop here with a clear error
            // instead of silently letting the check-in through unchecked.
            setError(th.gpsError);
            return;
          }
          // Check-out never enforces the geofence server-side (staff may
          // reasonably already be stepping out, indoors, etc.), so treat
          // location as best-effort here: proceed without it rather than
          // blocking someone from clocking out just because GPS was slow,
          // timed out, or briefly unavailable.
        }
      }

      try {
        const result =
          action === "in"
            ? await checkIn(lat, lng, photoDataUrl)
            : await checkOut(lat, lng, photoDataUrl);

        if (result.error) {
          setError(result.error);
        } else {
          setPhotoDataUrl(null);
        }
      } catch {
        setError(action === "in" ? th.gpsError : th.checkoutError);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div
        className={`rounded-2xl p-6 text-center ${
          isCheckedIn
            ? "bg-green-50 border border-green-200"
            : "bg-slate-100 border border-slate-200"
        }`}
      >
        <div
          className={`mx-auto mb-3 h-3 w-3 rounded-full ${
            isCheckedIn ? "bg-green-500 animate-pulse" : "bg-slate-400"
          }`}
        />
        <p className="text-lg font-semibold">
          {isCheckedIn ? th.checkedIn : th.checkedOut}
        </p>
        {openAttendance && (
          <p className="mt-1 text-sm text-slate-600">
            {th.since} {formatTime(openAttendance.check_in_at)} ·{" "}
            {formatDuration(hoursToday * 3600000)} {th.today}
          </p>
        )}
      </div>

      <PhotoCapture
        key={String(isCheckedIn)}
        onCapture={setPhotoDataUrl}
        disabled={isPending}
      />

      <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p>{th.photoRequiredHint}</p>
      </div>

      {site && (
        <div className="flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {th.locationCheck} <strong>{site.name}</strong> ({th.radius}{" "}
            {site.geofence_radius_m}m)
          </p>
        </div>
      )}


      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <button
        onClick={() => handleAction(isCheckedIn ? "out" : "in")}
        disabled={isPending || !photoDataUrl}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-5 text-lg font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 ${
          isCheckedIn
            ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
            : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
        }`}
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {th.processing}
          </>
        ) : isCheckedIn ? (
          th.checkOut
        ) : (
          th.checkIn
        )}
      </button>

      <p className="text-center text-xs leading-relaxed text-slate-600">
        {formatTodayHeader()}
      </p>
    </div>
  );
}
