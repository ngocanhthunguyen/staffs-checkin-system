"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw } from "lucide-react";
import { th } from "@/lib/i18n";

type Mode = "idle" | "camera" | "preview";

const MAX_DIMENSION = 480;
const QUALITY = 0.7;

export function PhotoCapture({
  onCapture,
  disabled,
}: {
  onCapture: (dataUrl: string | null) => void;
  disabled?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  useEffect(() => stopStream, []);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setMode("camera");
      // Wait a tick for the <video> element to mount before attaching the stream.
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch {
      setError(th.photoError);
      setMode("idle");
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const scale = Math.min(1, MAX_DIMENSION / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError(th.photoError);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);

    stopStream();
    setPreview(dataUrl);
    setMode("preview");
    onCapture(dataUrl);
  }

  function retake() {
    setPreview(null);
    onCapture(null);
    startCamera();
  }

  return (
    <div className="space-y-2">
      {mode === "preview" && preview && (
        <div className="relative overflow-hidden rounded-xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="check-in selfie" className="h-40 w-full object-cover" />
          <button
            type="button"
            onClick={retake}
            disabled={disabled}
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-black/70 disabled:opacity-60"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {th.retakePhoto}
          </button>
        </div>
      )}

      {mode === "camera" && (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-40 w-full scale-x-[-1] object-cover"
          />
          <button
            type="button"
            onClick={capture}
            disabled={disabled}
            className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg disabled:opacity-60"
          >
            <Camera className="h-4 w-4" />
            {th.capturePhoto}
          </button>
        </div>
      )}

      {mode === "idle" && (
        <button
          type="button"
          onClick={startCamera}
          disabled={disabled}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-8 text-slate-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-60"
        >
          <Camera className="h-6 w-6" />
          <span className="text-sm font-medium">{th.takePhoto}</span>
        </button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
