"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { MapPin, Loader2, ShieldCheck } from "lucide-react";
import { checkIn, checkOut } from "@/app/actions/attendance";
import { th } from "@/lib/i18n";
import { formatDuration, formatTime, formatTodayHeader, getCurrentPosition, getHoursBetween } from "@/lib/utils";
import { PhotoCapture } from "@/components/photo-capture";
import type { Attendance, Site } from "@/types/database";

function roundHours(n: number): number {
  return Math.round(n * 100) / 100;
}

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

  const totalRounded = useMemo(() => roundHours(hoursToday), [hoursToday]);
  const [normalHours, setNormalHours] = useState(String(totalRounded));
  const [otHours, setOtHours] = useState("0");

  // Keep the Normal/OT defaults in sync as time on shift grows, until the
  // staff member starts editing. Reset whenever a new open shift appears.
  useEffect(() => {
    setNormalHours(String(totalRounded));
    setOtHours("0");
  }, [openAttendance?.id, totalRounded]);

  function setAllNormal() {
    setNormalHours(String(totalRounded));
    setOtHours("0");
  }

  function setAllOt() {
    setNormalHours("0");
    setOtHours(String(totalRounded));
  }

  function onNormalChange(value: string) {
    setNormalHours(value);
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) {
      setOtHours(String(roundHours(Math.max(0, totalRounded - n))));
    }
  }

  function onOtChange(value: string) {
    setOtHours(value);
    const o = Number(value);
    if (Number.isFinite(o) && o >= 0) {
      setNormalHours(String(roundHours(Math.max(0, totalRounded - o))));
    }
  }

  async function handleAction(action: "in" | "out") {
    setError(null);

    if (!photoDataUrl) {
      setError(th.photoRequired);
      return;
    }

    let normal = 0;
    let ot = 0;
    if (action === "out" && openAttendance) {
      const freshTotal = roundHours(
        getHoursBetween(openAttendance.check_in_at, null)
      );
      normal = Number(normalHours);
      ot = Number(otHours);
      if (!Number.isFinite(normal) || !Number.isFinite(ot) || normal < 0 || ot < 0) {
        setError(th.hoursMustMatch);
        return;
      }
      // If a minute or two passed while filling the form, keep OT as entered
      // and adjust Normal so the two still add up to the live total.
      if (Math.abs(normal + ot - freshTotal) > 0.05) {
        ot = Math.min(ot, freshTotal);
        normal = roundHours(Math.max(0, freshTotal - ot));
        setNormalHours(String(normal));
        setOtHours(String(ot));
      }
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
            setError(th.gpsError);
            return;
          }
        }
      }

      // Re-read the split after GPS (can take several seconds) so we send
      // the latest Normal/OT values the staff member entered.
      let outNormal = normal;
      let outOt = ot;
      if (action === "out" && openAttendance) {
        const freshTotal = roundHours(
          getHoursBetween(openAttendance.check_in_at, null)
        );
        outNormal = Number(normalHours);
        outOt = Number(otHours);
        if (
          !Number.isFinite(outNormal) ||
          !Number.isFinite(outOt) ||
          outNormal < 0 ||
          outOt < 0
        ) {
          outNormal = freshTotal;
          outOt = 0;
        } else if (Math.abs(outNormal + outOt - freshTotal) > 0.05) {
          outOt = Math.min(Math.max(0, outOt), freshTotal);
          outNormal = roundHours(Math.max(0, freshTotal - outOt));
        }
      }

      try {
        const result =
          action === "in"
            ? await checkIn(lat, lng, photoDataUrl)
            : await checkOut(lat, lng, photoDataUrl, outNormal, outOt);

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

      {isCheckedIn && photoDataUrl && (
        <div className="space-y-3 rounded-xl border border-purple-200 bg-purple-50 p-4">
          <div>
            <p className="text-sm font-semibold text-purple-900">{th.splitHoursTitle}</p>
            <p className="mt-1 text-xs text-purple-700">{th.splitHoursHint}</p>
          </div>

          <p className="text-sm text-purple-900">
            {th.totalWorked}:{" "}
            <strong>
              {totalRounded.toFixed(2)} {th.hours}
            </strong>
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={setAllNormal}
              disabled={isPending}
              className="flex-1 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              {th.allNormal}
            </button>
            <button
              type="button"
              onClick={setAllOt}
              disabled={isPending}
              className="flex-1 rounded-lg bg-white px-3 py-2 text-xs font-medium text-purple-700 ring-1 ring-purple-200 hover:bg-purple-100 disabled:opacity-50"
            >
              {th.allOvertime}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                {th.regularHours}
              </label>
              <input
                type="number"
                min={0}
                max={totalRounded}
                step={0.25}
                value={normalHours}
                onChange={(e) => onNormalChange(e.target.value)}
                disabled={isPending}
                className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                {th.overtimeHours}
              </label>
              <input
                type="number"
                min={0}
                max={totalRounded}
                step={0.25}
                value={otHours}
                onChange={(e) => onOtChange(e.target.value)}
                disabled={isPending}
                className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}

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
