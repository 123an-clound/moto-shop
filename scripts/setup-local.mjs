import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
if (existsSync(".env.local")) {
  console.log(".env.local đã tồn tại; giữ nguyên cấu hình.");
} else {
  const password = randomBytes(15).toString("base64url");
  const sessionSecret = randomBytes(48).toString("base64url");
  writeFileSync(
    ".env.local",
    [
      "NEXT_PUBLIC_SITE_URL=http://localhost:3000",
      "NEXT_PUBLIC_SUPABASE_URL=",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=",
      "SUPABASE_SERVICE_ROLE_KEY=",
      "LOCAL_ADMIN_EMAIL=admin@motoshop.local",
      "LOCAL_ADMIN_PASSWORD=" + password,
      "SESSION_SECRET=" + sessionSecret,
      "SEPAY_WEBHOOK_SECRET=",
      "",
    ].join("\n"),
    { mode: 0o600, flag: "wx" },
  );
  mkdirSync(".local", { recursive: true });
  writeFileSync(
    ".local/ADMIN-ACCESS.txt",
    [
      "MotoShop local development",
      "Website: http://localhost:3000",
      "Admin: http://localhost:3000/admin",
      "Email: admin@motoshop.local",
      "Password: " + password,
      "",
      "Development only. Production requires Supabase Auth.",
      "The password can be changed in .env.local.",
      "Do not commit this file or .env.local.",
    ].join("\n"),
    { mode: 0o600 },
  );
  console.log(
    "Đã tạo cấu hình local. Xem tài khoản tại .local/ADMIN-ACCESS.txt.",
  );
}
