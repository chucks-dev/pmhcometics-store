"use client";

import { X } from "lucide-react";
import { useRef, useState } from "react";
import { Alert } from "@/components/ui/feedback";
import { Button, Input } from "@/components/ui/forms";
import { api } from "@/lib/api";

export interface Img {
  url: string;
  alt?: string | null;
}

/**
 * Uploads straight to the S3-compatible bucket via a presigned URL.
 * You can also paste an existing image URL.
 */
export function ImageUploader({
  images,
  onChange,
}: {
  images: Img[];
  onChange: (i: Img[]) => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [url, setUrl] = useState("");

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;

    setBusy(true);
    setErr("");

    try {
      const added: Img[] = [];

      for (const f of Array.from(files)) {
        const { uploadUrl, publicUrl } = await api<{
          uploadUrl: string;
          publicUrl: string;
        }>("/api/admin/uploads", {
          body: {
            contentType: f.type,
            size: f.size,
          },
        });

        console.log("R2 upload starting:", {
          file: f.name,
          type: f.type,
          size: f.size,
        });

        const res = await fetch(uploadUrl, {
          method: "PUT",
          body: f,
          headers: {
            "Content-Type": f.type,
          },
        });

        if (!res.ok) {
          let responseText = "";

          try {
            responseText = await res.text();
          } catch {
            responseText = "";
          }

          console.error("R2 upload failed:", {
            status: res.status,
            statusText: res.statusText,
            response: responseText,
          });

          throw new Error(
            `R2 upload failed: HTTP ${res.status}${
              res.statusText ? ` ${res.statusText}` : ""
            }`
          );
        }

        console.log("R2 upload successful:", publicUrl);

        added.push({
          url: publicUrl,
          alt: null,
        });
      }

      onChange([...images, ...added].slice(0, 10));
    } catch (e: unknown) {
      console.error("Image upload error:", e);

      const message =
        e instanceof Error ? e.message : "Image upload failed";

      setErr(message);
    }

    setBusy(false);

    if (file.current) {
      file.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <li
            key={img.url + i}
            className="relative h-24 w-24 overflow-hidden rounded-2xl border border-line"
          >
            <img
              src={img.url}
              alt=""
              className="h-full w-full object-cover"
            />

            {i === 0 && (
              <span className="absolute bottom-1 left-1 rounded-full bg-ink px-2 py-0.5 text-[10px] text-white">
                Main
              </span>
            )}

            <button
              type="button"
              aria-label="Remove image"
              onClick={() =>
                onChange(images.filter((_, n) => n !== i))
              }
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {i > 0 && (
              <button
                type="button"
                onClick={() =>
                  onChange([
                    img,
                    ...images.filter((_, n) => n !== i),
                  ])
                }
                className="absolute bottom-1 right-1 rounded-full bg-white px-1.5 text-[10px] shadow"
              >
                Make main
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-end gap-3">
        <input
          ref={file}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => upload(e.target.files)}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={busy}
          onClick={() => file.current?.click()}
        >
          Upload images
        </Button>

        <div className="flex min-w-[240px] flex-1 items-end gap-2">
          <div className="flex-1">
            <Input
              placeholder="…or paste an image URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-label="Image URL"
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (/^https?:\/\//.test(url)) {
                onChange([
                  ...images,
                  { url },
                ].slice(0, 10));

                setUrl("");
              }
            }}
          >
            Add
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted">
        JPG, PNG or WebP, up to 5 MB each. The first image is the main photo.
      </p>

      {err && <Alert>{err}</Alert>}
    </div>
  );
}