"use client";

import { useRef, useState, type DragEvent } from "react";

// Mirrors the backend upload rules in middleware/upload.js.
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

export type PickedImage = { file: File; url: string };

export function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateImage(file: File): string {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `"${file.name}" isn't a JPEG or PNG image. Convert it and try again.`;
  }
  if (file.size === 0) return `"${file.name}" is empty. Choose a different image.`;
  if (file.size > MAX_IMAGE_BYTES) {
    return `"${file.name}" is ${formatSize(file.size)}. Images must be 10 MB or smaller.`;
  }
  return "";
}

type ImageSlotProps = {
  id: string;
  kicker: string;
  title: string;
  hint: string;
  picked: PickedImage | null;
  onPick: (file: File) => void;
  onRemove: () => void;
};

export function ImageSlot({ id, kicker, title, hint, picked, onPick, onRemove }: ImageSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const errorId = `${id}-error`;

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const problem = validateImage(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    onPick(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
  }

  const browse = () => inputRef.current?.click();

  return (
    <div className="app-slot">
      <input
        ref={inputRef}
        id={id}
        type="file"
        className="sr-only"
        accept="image/jpeg,image/png"
        tabIndex={-1}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {picked ? (
        <div className="app-slot-body is-filled" onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} data-dragging={dragging || undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a local blob preview */}
          <img src={picked.url} alt={`Preview of your ${title.toLowerCase()}`} className="app-slot-thumb" />
          <div className="app-slot-info">
            <span className="app-upload-kicker">{kicker}</span>
            <strong title={picked.file.name}>{picked.file.name}</strong>
            <span className="app-slot-size">{formatSize(picked.file.size)}</span>
            <div className="app-slot-actions">
              <button type="button" onClick={browse}>
                Replace<span className="sr-only"> {title.toLowerCase()}</span>
              </button>
              <button type="button" className="is-danger" onClick={() => { setError(""); onRemove(); }}>
                Remove<span className="sr-only"> {title.toLowerCase()}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="app-slot-body"
          onClick={browse}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          data-dragging={dragging || undefined}
        >
          <span className="app-upload-kicker">{kicker}</span>
          <strong>{title}</strong>
          <span className="app-slot-drop">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
            </svg>
            Drop an image here or
            <button type="button" aria-label={`Browse for ${title.toLowerCase()}`}>
              browse
            </button>
          </span>
          <span className="app-upload-hint">{hint}</span>
        </div>
      )}

      <p id={errorId} className="app-slot-error" aria-live="polite">
        {error}
      </p>
    </div>
  );
}
