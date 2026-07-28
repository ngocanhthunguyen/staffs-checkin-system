import type { Site } from "@/types/database";

const EARTH_RADIUS_M = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function distanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinGeofence(
  userLat: number,
  userLng: number,
  site: Pick<Site, "latitude" | "longitude" | "geofence_radius_m">
): boolean {
  if (site.latitude == null || site.longitude == null) return true;
  const distance = distanceInMeters(userLat, userLng, site.latitude, site.longitude);
  return distance <= site.geofence_radius_m;
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} นาที / ${minutes}m`;
  return `${hours} ชม. ${minutes} นาที / ${hours}h ${minutes}m`;
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** Clear bilingual date: 28 Jul 2026 / 28 กรกฎาคม 2569 */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const en = d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const thai = d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${en} / ${thai}`;
}

/** Today header on check-in page */
export function formatTodayHeader(date: Date = new Date()): string {
  const en = date.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const thai = date.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${en} / ${thai}`;
}

export function getHoursBetween(checkIn: string, checkOut: string | null): number {
  const start = new Date(checkIn).getTime();
  const end = checkOut ? new Date(checkOut).getTime() : Date.now();
  return Math.max(0, (end - start) / 3600000);
}

export async function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported on this device"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}
