"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { api } from "@/lib/client-api";
import { Field } from "./form-controls";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function login() {
    setPending(true);
    setError("");
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.replace("/admin");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đăng nhập.");
      setPending(false);
    }
  }
  return (
    <main className="adm-login">
      <div className="adm-login-card">
        <Link className="adm-brand" href="/">
          MOTO<span>SHOP</span>
          <small>QUẢN TRỊ CỬA HÀNG</small>
        </Link>
        <div className="adm-login-heading">
          <LockKeyhole size={24} aria-hidden="true" />
          <h1>Đăng nhập quản trị</h1>
        </div>
        <p>Quản lý xe, đơn đặt hàng và lịch trải nghiệm tại một nơi.</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void login();
          }}
        >
          <Field label="Email quản trị">
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@motoshop.local"
              disabled={pending}
            />
          </Field>
          <Field label="Mật khẩu">
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={pending}
            />
          </Field>
          {error && (
            <p role="alert" className="adm-error">
              {error}
            </p>
          )}
          <button type="submit" disabled={pending} className="adm-button">
            {pending ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>
        <p className="adm-hint">
          Tài khoản cục bộ được cấu hình bằng ADMIN_EMAIL và ADMIN_PASSWORD
          trong .env.local. Khi dùng Supabase, đăng nhập bằng tài khoản đã được
          cấp quyền quản trị.
        </p>
        <Link className="adm-back" href="/">
          <ArrowLeft size={16} aria-hidden="true" />
          Trở về cửa hàng
        </Link>
      </div>
    </main>
  );
}
