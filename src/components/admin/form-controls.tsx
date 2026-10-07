"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { api } from "@/lib/client-api";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="adm-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function ImageUpload({
  onUpload,
  label = "Tải ảnh lên",
}: {
  onUpload: (url: string) => void;
  label?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function upload(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) {
      setError("Chọn ảnh JPG, PNG, WebP hoặc AVIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh tối đa 5 MB.");
      return;
    }
    setPending(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const result = await api<{ url: string }>("/api/admin/upload", {
        method: "POST",
        body,
      });
      onUpload(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải ảnh.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="adm-upload">
      <label className="adm-button adm-secondary">
        <Upload size={17} aria-hidden="true" />
        {pending ? "Đang tải ảnh…" : label}
        <input
          aria-label={label}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={pending}
          onChange={(event) => {
            void upload(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </label>
      {error && (
        <p className="adm-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function ImagePreview({ src, alt }: { src: string; alt: string }) {
  if (!/^(https?:\/\/|\/(?!\/))/.test(src))
    return <div className="adm-image-empty">Chưa có ảnh</div>;
  return (
    <Image
      className="adm-preview"
      src={src}
      alt={alt}
      width={160}
      height={110}
      unoptimized
    />
  );
}
