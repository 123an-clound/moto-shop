import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { HttpError, requirePersistence } from "./http";
import { hasSupabase } from "@/utils/supabase/config";
import { createServerSupabase } from "@/utils/supabase/server";

const COOKIE = "motoshop_admin";
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32)
    throw new HttpError(
      503,
      "SESSION_SECRET cần ít nhất 32 ký tự.",
      "AUTH_NOT_CONFIGURED",
    );
  return value;
}
export function constantTimeEqual(a: string, b: string) {
  return timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest(),
  );
}
function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}
export function createLocalSession(email: string, now = Date.now()) {
  const payload = Buffer.from(
    JSON.stringify({ email, expires: now + 8 * 3600000 }),
  ).toString("base64url");
  return `${payload}.${signature(payload)}`;
}
export function verifyLocalSession(token: string, now = Date.now()) {
  const parts = token.split(".");
  if (parts.length !== 2 || !constantTimeEqual(signature(parts[0]), parts[1]))
    return false;
  try {
    const value = JSON.parse(
      Buffer.from(parts[0], "base64url").toString("utf8"),
    );
    return (
      typeof value.expires === "number" &&
      value.expires > now &&
      value.email === process.env.LOCAL_ADMIN_EMAIL
    );
  } catch {
    return false;
  }
}
export async function requireAdmin() {
  requirePersistence();
  if (hasSupabase()) {
    const client = await createServerSupabase();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user)
      throw new HttpError(401, "Vui lòng đăng nhập quản trị.", "UNAUTHORIZED");
    if (data.user.app_metadata?.motoshop_role !== "admin")
      throw new HttpError(
        403,
        "Tài khoản không có quyền quản trị.",
        "FORBIDDEN",
      );
    return;
  }
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !verifyLocalSession(token))
    throw new HttpError(401, "Vui lòng đăng nhập quản trị.", "UNAUTHORIZED");
}
export async function loginAdmin(email: string, password: string) {
  requirePersistence();
  if (hasSupabase()) {
    const client = await createServerSupabase();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user || data.user.app_metadata?.motoshop_role !== "admin") {
      await client.auth.signOut();
      throw new HttpError(
        401,
        "Email hoặc mật khẩu quản trị không đúng.",
        "INVALID_LOGIN",
      );
    }
    return { mode: "supabase" };
  }
  const configuredEmail = process.env.LOCAL_ADMIN_EMAIL;
  const configuredPassword = process.env.LOCAL_ADMIN_PASSWORD;
  if (!configuredEmail || !configuredPassword || configuredPassword.length < 12)
    throw new HttpError(
      503,
      "Cần cấu hình tài khoản quản trị local và mật khẩu ít nhất 12 ký tự.",
      "AUTH_NOT_CONFIGURED",
    );
  const correctEmail = constantTimeEqual(email, configuredEmail);
  const correctPassword = constantTimeEqual(password, configuredPassword);
  if (!correctEmail || !correctPassword)
    throw new HttpError(
      401,
      "Email hoặc mật khẩu quản trị không đúng.",
      "INVALID_LOGIN",
    );
  (await cookies()).set(COOKIE, createLocalSession(email), {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 3600,
  });
  return { mode: "local" };
}
export async function logoutAdmin() {
  if (hasSupabase()) {
    const client = await createServerSupabase();
    await client.auth.signOut();
  }
  (await cookies()).delete(COOKIE);
}
