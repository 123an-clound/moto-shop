import {
  api,
  HttpError,
  readJson,
  requirePersistence,
  rateLimit,
} from "@/lib/http";
import { constantTimeEqual } from "@/lib/auth";
import { sepaySchema } from "@/lib/validation";
import { applyPayment } from "@/lib/repository";

export async function POST(request: Request) {
  return api(async () => {
    requirePersistence();
    const secret = process.env.SEPAY_WEBHOOK_SECRET;
    if (!secret || secret.length < 32)
      throw new HttpError(
        503,
        "Chưa cấu hình webhook thanh toán.",
        "PAYMENT_NOT_CONFIGURED",
      );
    if (
      !constantTimeEqual(
        request.headers.get("authorization") || "",
        `Apikey ${secret}`,
      )
    )
      throw new HttpError(401, "Webhook chưa được xác thực.");
    await rateLimit(request, "sepay", 120);
    const event = await readJson(request, sepaySchema, 16384);
    if (event.transferType !== "in" || String(event.id) === "0")
      return { success: true, matched: false };
    const code = `${event.code || ""} ${event.content}`
      .toUpperCase()
      .match(/\bMS[A-F0-9]{12}\b/)?.[0];
    if (!code) return { success: true, matched: false };
    return applyPayment(
      `sepay:${event.id}`,
      code,
      event.transferAmount,
      event.accountNumber,
    );
  });
}
