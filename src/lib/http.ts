import { randomUUID, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { hasSupabase } from "@/utils/supabase/config";
import { createServiceSupabase } from "@/utils/supabase/service";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "REQUEST_ERROR",
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
    },
  });
}

export async function api(action: () => Promise<unknown>) {
  const requestId = randomUUID();
  try {
    const result = await action();
    const response = result instanceof Response ? result : json(result);
    response.headers.set("X-Request-Id", requestId);
    return response;
  } catch (error) {
    const known = error instanceof HttpError;
    const status = known ? error.status : 500;
    // No request bodies, tokens, or customer details in logs.
    console.error(
      JSON.stringify({
        event: "api_error",
        requestId,
        status,
        code: known ? error.code : "INTERNAL_ERROR",
      }),
    );
    return json(
      {
        error: known
          ? error.message
          : "Không thể xử lý yêu cầu. Vui lòng thử lại.",
        code: known ? error.code : "INTERNAL_ERROR",
        requestId,
      },
      status,
    );
  }
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(request.url).origin;
  const configured = process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
    : expected;
  // Next dev can normalize request.url to localhost when bound to 127.0.0.1.
  // Permit the loopback alias only in development and only on the same port.
  let localAlias = false;
  if (origin && process.env.NODE_ENV === "development") {
    try {
      const incoming = new URL(origin),
        target = new URL(expected);
      const loopback = ["localhost", "127.0.0.1", "[::1]"];
      localAlias =
        loopback.includes(incoming.hostname) &&
        loopback.includes(target.hostname) &&
        incoming.port === target.port &&
        incoming.protocol === target.protocol;
    } catch {
      /* malformed origins are rejected below */
    }
  }
  if (
    !origin ||
    (!localAlias && origin !== expected && origin !== configured) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new HttpError(
      403,
      "Yêu cầu phải được gửi từ website.",
      "CSRF_REJECTED",
    );
  }
}

export async function readJson<T>(
  request: Request,
  schema: z.ZodType<T>,
  limit = 131072,
): Promise<T> {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new HttpError(415, "Yêu cầu cần dữ liệu JSON.");
  const declared = Number(request.headers.get("content-length"));
  if (declared > limit) throw new HttpError(413, "Dữ liệu gửi quá lớn.");
  if (!request.body) throw new HttpError(400, "Thiếu dữ liệu.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) {
        await reader.cancel();
        throw new HttpError(413, "Dữ liệu gửi quá lớn.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  let body: unknown;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "JSON không hợp lệ.");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    throw new HttpError(
      400,
      parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ.",
      "VALIDATION_ERROR",
    );
  return parsed.data;
}

const buckets = new Map<string, { count: number; expires: number }>();
export async function rateLimit(
  request: Request,
  scope: string,
  maximum: number,
  seconds = 60,
) {
  // Forwarded IP headers should be overwritten by the trusted deployment proxy.
  const address =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local";
  const key = createHash("sha256").update(`${scope}:${address}`).digest("hex");
  if (hasSupabase()) {
    const { data, error } = await createServiceSupabase().rpc(
      "moto_consume_rate_limit",
      { p_key: key, p_maximum: maximum, p_seconds: seconds },
    );
    if (error)
      throw new HttpError(
        503,
        "Tạm thời chưa thể xử lý yêu cầu.",
        "RATE_LIMIT_UNAVAILABLE",
      );
    if (!data)
      throw new HttpError(
        429,
        "Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau.",
        "RATE_LIMITED",
      );
    return;
  }
  const now = Date.now();
  if (buckets.size > 10000)
    for (const [k, value] of buckets)
      if (value.expires < now) buckets.delete(k);
  const bucket = buckets.get(key);
  if (bucket && bucket.expires > now) {
    if (bucket.count >= maximum)
      throw new HttpError(
        429,
        "Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau.",
        "RATE_LIMITED",
      );
    bucket.count++;
  } else buckets.set(key, { count: 1, expires: now + seconds * 1000 });
}

export function requirePersistence() {
  if (
    !hasSupabase() &&
    process.env.NODE_ENV !== "development" &&
    process.env.NODE_ENV !== "test"
  ) {
    throw new HttpError(
      503,
      "Website chưa kết nối Supabase. Vui lòng cấu hình trước khi nhận đơn hàng hoặc dùng quản trị.",
      "PERSISTENCE_NOT_CONFIGURED",
    );
  }
  if (
    hasSupabase() &&
    !(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
  ) {
    throw new HttpError(
      503,
      "Chưa cấu hình khóa Supabase phía máy chủ.",
      "SERVER_KEY_NOT_CONFIGURED",
    );
  }
}

export async function browserMutation(
  request: Request,
  scope: string,
  maximum = 30,
  seconds = 60,
) {
  sameOrigin(request);
  requirePersistence();
  await rateLimit(request, scope, maximum, seconds);
}
