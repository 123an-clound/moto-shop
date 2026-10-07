import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { orderSchema, settingsSchema, productSchema } from "./validation";
import { sameOrigin, readJson, requirePersistence } from "./http";
import { createLocalSession, verifyLocalSession } from "./auth";
import type { Product } from "@/types";
import productSeed from "@/data/products.json";
import settingSeed from "@/data/settings.json";

const product = productSeed[0] as Product;
const input = {
  fullName: "Nguyễn Văn An",
  phone: "0901234567",
  email: "",
  address: "25 Nguyễn Trãi, TP.HCM",
  notes: "",
  paymentMethod: "cod" as const,
  items: [
    { productId: product.id, variantId: product.variants[0].id, quantity: 1 },
  ],
  idempotencyKey: "test-order-00000001",
};
let directory: string;
let repository: typeof import("./repository");

beforeAll(async () => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
  vi.stubEnv(
    "SESSION_SECRET",
    "test-secret-with-at-least-thirty-two-characters",
  );
  vi.stubEnv("LOCAL_ADMIN_EMAIL", "admin@example.com");
  directory = await fs.mkdtemp(path.join(os.tmpdir(), "motoshop-backend-"));
  vi.spyOn(process, "cwd").mockReturnValue(directory);
  repository = await import("./repository");
});
afterAll(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await fs.rm(directory, { recursive: true, force: true });
});

describe("request boundaries", () => {
  it("rejects unknown price fields, repeated variants, and invalid phone", () => {
    expect(orderSchema.safeParse({ ...input, total: 1 }).success).toBe(false);
    expect(orderSchema.safeParse({ ...input, phone: "invalid" }).success).toBe(
      false,
    );
    expect(
      orderSchema.safeParse({
        ...input,
        items: [...input.items, ...input.items],
      }).success,
    ).toBe(false);
    expect(orderSchema.parse({ ...input, phone: "090 123 4567" }).phone).toBe(
      "0901234567",
    );
  });
  it("accepts all seeded products and settings through admin validation", () => {
    for (const item of productSeed)
      expect(productSchema.safeParse(item).success, item.slug).toBe(true);
    expect(settingsSchema.safeParse(settingSeed).success).toBe(true);
  });
  it("rejects cross-origin and missing-origin browser writes", () => {
    expect(() =>
      sameOrigin(
        new Request("http://localhost:3000/api/orders", {
          headers: { origin: "https://evil.example" },
        }),
      ),
    ).toThrow();
    expect(() =>
      sameOrigin(new Request("http://localhost:3000/api/orders")),
    ).toThrow();
    expect(() =>
      sameOrigin(
        new Request("http://localhost:3000/api/orders", {
          headers: { origin: "http://localhost:3000" },
        }),
      ),
    ).not.toThrow();
  });
  it("allows loopback aliases only in development on the same port", () => {
    const request = new Request("http://localhost:3000/api/orders", {
      headers: { origin: "http://127.0.0.1:3000" },
    });
    vi.stubEnv("NODE_ENV", "development");
    expect(() => sameOrigin(request)).not.toThrow();
    expect(() =>
      sameOrigin(
        new Request("http://localhost:3000/api/orders", {
          headers: { origin: "http://127.0.0.1:4000" },
        }),
      ),
    ).toThrow();
    vi.stubEnv("NODE_ENV", "production");
    expect(() => sameOrigin(request)).toThrow();
    vi.stubEnv("NODE_ENV", "test");
  });
  it("limits streamed JSON and refuses unsupported content types", async () => {
    const req = new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    await expect(readJson(req, orderSchema, 20)).rejects.toMatchObject({
      status: 413,
    });
    await expect(
      readJson(
        new Request("http://localhost", { method: "POST", body: "text" }),
        orderSchema,
      ),
    ).rejects.toMatchObject({ status: 415 });
  });
  it("fails closed in production without Supabase", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => requirePersistence()).toThrow("chưa kết nối Supabase");
    vi.stubEnv("NODE_ENV", "test");
  });
});
describe("admin session signatures", () => {
  it("verifies the signature, configured identity, and expiry", () => {
    const token = createLocalSession("admin@example.com", 1000);
    expect(verifyLocalSession(token, 2000)).toBe(true);
    expect(verifyLocalSession(`${token}tampered`, 2000)).toBe(false);
    expect(verifyLocalSession(token, 1000 + 9 * 3600000)).toBe(false);
    expect(
      verifyLocalSession(createLocalSession("other@example.com", 1000), 2000),
    ).toBe(false);
  });
});
describe("atomic local persistence", () => {
  it("uses server price, reserves stock once, and rejects idempotency conflicts", async () => {
    const before = (await repository.getProducts()).find(
      (p) => p.id === product.id,
    )!;
    const receipt = await repository.createOrder(input);
    expect(receipt.order.total).toBe(before.salePrice ?? before.price);
    expect(receipt.order.deposit).toBe(0);
    expect(receipt.order.paymentStatus).toBe("unpaid");
    const retry = await repository.createOrder(input);
    expect(retry.order.id).toBe(receipt.order.id);
    expect(
      (await repository.getProducts()).find((p) => p.id === product.id)!
        .variants[0].stock,
    ).toBe(before.variants[0].stock - 1);
    await expect(
      repository.createOrder({ ...input, notes: "changed" }),
    ).rejects.toMatchObject({ status: 409 });
    const lookup = await repository.lookupOrder(
      receipt.order.code,
      input.phone,
    );
    expect(lookup).not.toHaveProperty("phone");
    expect(lookup).not.toHaveProperty("address");
    expect(lookup).not.toHaveProperty("fullName");
    await expect(
      repository.lookupOrder(receipt.order.code, "0907654321"),
    ).rejects.toMatchObject({ status: 404 });
    await repository.updateOrder(receipt.order.id, "cancelled");
    await repository.updateOrder(receipt.order.id, "cancelled");
    expect(
      (await repository.getProducts()).find((p) => p.id === product.id)!
        .variants[0].stock,
    ).toBe(before.variants[0].stock);
    await expect(
      repository.updateOrder(receipt.order.id, "pending"),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("serializes simultaneous orders and rolls back insufficient stock", async () => {
    const updated = structuredClone(product);
    updated.variants[0].stock = 1;
    await repository.saveProduct(updated);
    const results = await Promise.allSettled([
      repository.createOrder({
        ...input,
        idempotencyKey: "parallel-order-0001",
      }),
      repository.createOrder({
        ...input,
        idempotencyKey: "parallel-order-0002",
      }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    expect(
      (await repository.getProducts()).find((p) => p.id === product.id)!
        .variants[0].stock,
    ).toBe(0);
    expect(await repository.getSalesCounts()).toEqual({});
    const successful = results.find((r) => r.status === "fulfilled");
    if (successful?.status === "fulfilled")
      await repository.updateOrder(successful.value.order.id, "completed");
    expect((await repository.getSalesCounts())[product.id]).toBe(1);
  });
  it("does not confirm a bank order with wrong account, low amount or replay", async () => {
    const settings = await repository.getSettings();
    await repository.saveSettings({
      ...settings,
      bankBin: "970436",
      bankAccount: "123456789",
      bankName: "TEST ACCOUNT",
    });
    const updated = structuredClone(product);
    updated.variants[0].stock = 5;
    await repository.saveProduct(updated);
    const receipt = await repository.createOrder({
      ...input,
      paymentMethod: "bank",
      idempotencyKey: "bank-order-00000001",
    });
    expect(receipt.qrUrl).toContain("amount=");
    expect(
      await repository.applyPayment(
        "sepay:test1",
        receipt.order.code,
        receipt.order.deposit,
        "other",
      ),
    ).toMatchObject({ matched: false });
    expect(
      await repository.applyPayment(
        "sepay:test2",
        receipt.order.code,
        receipt.order.deposit - 1,
        "123456789",
      ),
    ).toMatchObject({ matched: false });
    expect(
      (await repository.lookupOrder(receipt.order.code, input.phone))
        .paymentStatus,
    ).toBe("unpaid");
    expect(
      await repository.applyPayment(
        "sepay:test3",
        receipt.order.code,
        receipt.order.deposit,
        "123456789",
      ),
    ).toMatchObject({ matched: true });
    expect(
      await repository.applyPayment(
        "sepay:test3",
        receipt.order.code,
        receipt.order.deposit,
        "123456789",
      ),
    ).toMatchObject({ duplicate: true });
    expect(
      (await repository.lookupOrder(receipt.order.code, input.phone))
        .paymentStatus,
    ).toBe("paid");
    const snapshot = await repository.getAdminSnapshot();
    expect(snapshot.orders[0]).not.toHaveProperty("fingerprint");
  });
});
