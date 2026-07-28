"use client";

import { useRef, useState } from "react";
import { Camera, RotateCcw } from "lucide-react";
import { compressImageFile } from "@/lib/utils";
import { th } from "@/lib/i18n";

export function PhotoCapture({
  onCapture,
  disabled,
}: {
  onCapture: (dataUrl: string | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      setError(null);
      const dataUrl = await compressImageFile(file);
      setPreview(dataUrl);
      onCapture(dataUrl);
    } catch {
      setError(th.photoError);
      onCapture(null);
    }
  }

  function retake() {
    setPreview(null);
    onCapture(null);
    inputRef.current?.click();
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFile}
        className="hidden"
        disabled={disabled}
      />

      {preview ? (
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
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
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
