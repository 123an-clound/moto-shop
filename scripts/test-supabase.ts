import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import productSeed from "../src/data/products.json";
import settingSeed from "../src/data/settings.json";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  // This test creates and changes records, so it is restricted to this project's isolated local stack.
  if (!["http://127.0.0.1:57321", "http://localhost:57321"].includes(url))
    throw new Error(
      "Integration tests only run on MotoShop's isolated local Supabase at port 57321.",
    );
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  assert.ok(secret && anonKey, "Local Supabase keys required");
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const service = createClient(url, secret, options);
  const anon = createClient(url, anonKey, options);
  const products = structuredClone(productSeed);
  for (const product of products) {
    const { error } = await service.rpc("upsert_product", {
      p_product: product,
    });
    assert.equal(error, null, `Seed ${product.slug}: ${error?.message}`);
  }
  const settings = {
    ...settingSeed,
    bankBin: "970436",
    bankAccount: "123456789",
    bankName: "LOCAL TEST",
  };
  assert.equal(
    (await service.from("site_settings").upsert({ id: 1, config: settings }))
      .error,
    null,
  );
  const catalog = await anon.from("products").select("id,product_variants(id)");
  assert.equal(catalog.error, null);
  assert.equal(catalog.data?.length, 30);
  const unpublished = products[1];
  unpublished.published = false;
  assert.equal(
    (await service.rpc("upsert_product", { p_product: unpublished })).error,
    null,
  );
  assert.equal(
    (await anon.from("products").select("id").eq("id", unpublished.id)).data
      ?.length,
    0,
  );
  assert.equal(
    (
      await anon
        .from("product_variants")
        .select("id")
        .eq("product_id", unpublished.id)
    ).data?.length,
    0,
  );
  const privateOrders = await anon.from("orders").select("*");
  assert.ok(privateOrders.error || privateOrders.data?.length === 0);
  assert.ok(
    (await anon.rpc("create_order", { p_input: {}, p_fingerprint: "test" }))
      .error,
    "Anonymous RPC access must be denied",
  );
  assert.ok(
    (
      await anon
        .from("test_drives")
        .insert({ full_name: "test", phone: "0901234567" })
    ).error,
    "Anonymous lead writes must be denied",
  );

  const password = `Test-${randomUUID()}`;
  const adminEmail = `admin-${randomUUID()}@example.com`;
  const userEmail = `user-${randomUUID()}@example.com`;
  const adminUser = await service.auth.admin.createUser({
    email: adminEmail,
    password,
    email_confirm: true,
    app_metadata: { role: "admin" },
  });
  assert.equal(adminUser.error, null);
  const normalUser = await service.auth.admin.createUser({
    email: userEmail,
    password,
    email_confirm: true,
    user_metadata: { role: "admin" },
  });
  assert.equal(normalUser.error, null);
  const admin = createClient(url, anonKey, options);
  const normal = createClient(url, anonKey, options);
  assert.equal(
    (await admin.auth.signInWithPassword({ email: adminEmail, password }))
      .error,
    null,
  );
  assert.equal(
    (await normal.auth.signInWithPassword({ email: userEmail, password }))
      .error,
    null,
  );
  assert.equal(
    (await admin.from("products").select("id").eq("id", unpublished.id)).data
      ?.length,
    1,
  );
  assert.equal(
    (await normal.from("products").select("id").eq("id", unpublished.id)).data
      ?.length,
    0,
  );
  const forbidden = await normal
    .from("products")
    .update({ name: "attacker" })
    .eq("id", products[0].id)
    .select("id");
  assert.ok(
    forbidden.error || forbidden.data?.length === 0,
    "user_metadata must not grant admin access",
  );
  assert.equal(
    (
      await admin
        .from("products")
        .update({ name: products[0].name })
        .eq("id", products[0].id)
        .select("id")
    ).data?.length,
    1,
  );

  const product = products[0];
  product.variants[0].stock = 2;
  assert.equal(
    (await service.rpc("upsert_product", { p_product: product })).error,
    null,
  );
  const input = {
    fullName: "Local Test",
    phone: "0901234567",
    email: "",
    address: "Local test address",
    notes: "",
    paymentMethod: "bank",
    items: [
      { productId: product.id, variantId: product.variants[0].id, quantity: 1 },
    ],
    idempotencyKey: `test-${randomUUID()}`,
  };
  const first = await service.rpc("create_order", {
    p_input: input,
    p_fingerprint: "fingerprint-one",
  });
  assert.equal(first.error, null, first.error?.message);
  assert.equal(first.data.total, product.salePrice ?? product.price);
  assert.equal(first.data.paymentStatus, "unpaid");
  const retry = await service.rpc("create_order", {
    p_input: input,
    p_fingerprint: "fingerprint-one",
  });
  assert.equal(retry.error, null);
  assert.equal(retry.data.id, first.data.id);
  assert.equal(
    (
      await service
        .from("product_variants")
        .select("stock_quantity")
        .eq("id", product.variants[0].id)
        .single()
    ).data?.stock_quantity,
    1,
  );
  assert.ok(
    (
      await service.rpc("create_order", {
        p_input: input,
        p_fingerprint: "fingerprint-different",
      })
    ).error?.message.includes("IDEMPOTENCY_CONFLICT"),
  );
  const concurrent = await Promise.all([
    service.rpc("create_order", {
      p_input: { ...input, idempotencyKey: `test-${randomUUID()}` },
      p_fingerprint: "a",
    }),
    service.rpc("create_order", {
      p_input: { ...input, idempotencyKey: `test-${randomUUID()}` },
      p_fingerprint: "b",
    }),
  ]);
  assert.equal(
    concurrent.filter((r) => !r.error).length,
    1,
    "Only one transaction can reserve the last unit",
  );
  assert.equal(
    (
      await service
        .from("product_variants")
        .select("stock_quantity")
        .eq("id", product.variants[0].id)
        .single()
    ).data?.stock_quantity,
    0,
  );
  assert.equal(
    (
      await service.rpc("apply_payment", {
        p_event_id: "sepay:low",
        p_code: first.data.code,
        p_amount: first.data.deposit - 1,
        p_account: settings.bankAccount,
      })
    ).data?.matched,
    false,
  );
  assert.equal(
    (
      await service.rpc("apply_payment", {
        p_event_id: "sepay:wrong",
        p_code: first.data.code,
        p_amount: first.data.deposit,
        p_account: "wrong",
      })
    ).data?.matched,
    false,
  );
  assert.equal(
    (
      await service.rpc("apply_payment", {
        p_event_id: "sepay:valid",
        p_code: first.data.code,
        p_amount: first.data.deposit,
        p_account: settings.bankAccount,
      })
    ).data?.matched,
    true,
  );
  assert.equal(
    (
      await service.rpc("apply_payment", {
        p_event_id: "sepay:valid",
        p_code: first.data.code,
        p_amount: first.data.deposit,
        p_account: settings.bankAccount,
      })
    ).data?.duplicate,
    true,
  );
  assert.equal(
    (
      await service.rpc("update_order_status", {
        p_id: first.data.id,
        p_status: "completed",
        p_payment_status: null,
      })
    ).error,
    null,
  );
  assert.equal((await service.rpc("get_sales_counts")).data?.[product.id], 1);
  const outstanding = concurrent.find((r) => !r.error)!.data;
  assert.equal(
    (
      await service.rpc("update_order_status", {
        p_id: outstanding.id,
        p_status: "cancelled",
        p_payment_status: null,
      })
    ).error,
    null,
  );
  assert.equal(
    (
      await service.rpc("update_order_status", {
        p_id: outstanding.id,
        p_status: "cancelled",
        p_payment_status: null,
      })
    ).error,
    null,
  );
  assert.equal(
    (
      await service
        .from("product_variants")
        .select("stock_quantity")
        .eq("id", product.variants[0].id)
        .single()
    ).data?.stock_quantity,
    1,
  );
  assert.ok(
    (
      await service.rpc("update_order_status", {
        p_id: outstanding.id,
        p_status: "pending",
        p_payment_status: null,
      })
    ).error?.message.includes("INVALID_TRANSITION"),
  );
  const limitKey = randomUUID();
  for (let n = 0; n < 3; n++)
    assert.equal(
      (
        await service.rpc("consume_rate_limit", {
          p_key: limitKey,
          p_maximum: 2,
          p_seconds: 60,
        })
      ).data,
      n < 2,
    );
  const image = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl9ZREAAAAASUVORK5CYII=",
    "base64",
  );
  assert.ok(
    (
      await normal.storage
        .from("product-images")
        .upload(`test-${randomUUID()}.png`, image, { contentType: "image/png" })
    ).error,
  );
  const imageName = `test-${randomUUID()}.png`;
  assert.equal(
    (
      await admin.storage
        .from("product-images")
        .upload(imageName, image, { contentType: "image/png" })
    ).error,
    null,
  );
  assert.equal(
    (await admin.storage.from("product-images").remove([imageName])).error,
    null,
  );
  assert.equal(
    (await service.auth.admin.deleteUser(adminUser.data.user!.id)).error,
    null,
  );
  assert.equal(
    (await service.auth.admin.deleteUser(normalUser.data.user!.id)).error,
    null,
  );
  console.log(
    "Supabase integration passed: migration + 30 seeds, public/admin RLS, forged metadata denied, transaction/idempotency/concurrent inventory, payment replay/account/amount checks, sales aggregate, cancellation, rate limit, Storage policies.",
  );
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Integration test failed.",
  );
  process.exitCode = 1;
});
