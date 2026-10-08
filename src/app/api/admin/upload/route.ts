import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { api, browserMutation, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { hasSupabase } from "@/utils/supabase/config";
import { createServiceSupabase } from "@/utils/supabase/service";

const maxFile = 5 * 1024 * 1024;
const uploadSchema = z
  .custom<File>((value) => value instanceof File)
  .refine(
    (file) => file.size > 0 && file.size <= maxFile,
    "Ảnh cần nhỏ hơn 5 MB.",
  )
  .refine(
    (file) =>
      ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
        file.type,
      ),
    "Chỉ nhận ảnh JPEG, PNG, WebP hoặc AVIF.",
  );
function imageExtension(buffer: Buffer, mime: string) {
  if (
    mime === "image/jpeg" &&
    buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
  )
    return "jpg";
  if (
    mime === "image/png" &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "png";
  if (
    mime === "image/webp" &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  )
    return "webp";
  if (
    mime === "image/avif" &&
    buffer.toString("ascii", 4, 8) === "ftyp" &&
    ["avif", "avis"].includes(buffer.toString("ascii", 8, 12))
  )
    return "avif";
  throw new HttpError(400, "Nội dung tệp không khớp định dạng ảnh.");
}
export async function POST(request: Request) {
  return api(async () => {
    await browserMutation(request, "admin-upload", 20);
    await requireAdmin();
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.startsWith("multipart/form-data;"))
      throw new HttpError(415, "Cần gửi ảnh bằng multipart/form-data.");
    const limit = maxFile + 65536;
    if (Number(request.headers.get("content-length")) > limit || !request.body)
      throw new HttpError(413, "Ảnh cần nhỏ hơn 5 MB.");
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > limit) {
          await reader.cancel();
          throw new HttpError(413, "Ảnh cần nhỏ hơn 5 MB.");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    let form: FormData;
    try {
      form = await new Response(Buffer.concat(chunks), {
        headers: { "content-type": contentType },
      }).formData();
    } catch {
      throw new HttpError(400, "Dữ liệu upload không hợp lệ.");
    }
    const parsed = uploadSchema.safeParse(form.get("file"));
    if (!parsed.success)
      throw new HttpError(
        400,
        parsed.error.issues[0]?.message || "Tệp ảnh không hợp lệ.",
      );
    const file = parsed.data;
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${randomUUID()}.${imageExtension(buffer, file.type)}`;
    if (hasSupabase()) {
      const client = createServiceSupabase();
      const { error } = await client.storage
        .from("moto-product-images")
        .upload(filename, buffer, {
          contentType: file.type,
          cacheControl: "31536000",
          upsert: false,
        });
      if (error) throw new HttpError(503, "Không thể tải ảnh lên Storage.");
      return {
        url: client.storage.from("moto-product-images").getPublicUrl(filename).data
          .publicUrl,
      };
    }
    const directory = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, filename), buffer, { flag: "wx" });
    return { url: `/uploads/${filename}` };
  });
}
