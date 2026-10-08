import { afterEach, expect, it, vi } from "vitest";
import seed from "@/data/products.json";
import { getProducts } from "./repository";
import { productSchema } from "./validation";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("allows a product returned by Postgres to pass admin save validation", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://motoshop-test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-public-key");
  vi.stubEnv("SUPABASE_SECRET_KEY", "test-server-key");
  const product = seed[0];
  const row = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    type: product.type,
    price_original: product.price,
    price_sale: product.salePrice,
    description: product.description,
    featured: product.featured,
    in_stock: product.inStock,
    published: product.published,
    created_at: "2026-10-06T07:00:00+07:00",
    engine_cc: product.engineCc,
    motor_kw: product.motorKw,
    battery_kwh: product.batteryKwh,
    range_km: product.rangeKm,
    seat_height: product.seatHeight,
    brake: product.brake,
    source_url: product.sourceUrl,
    source_date: product.sourceDate,
    price_note: product.priceNote,
    product_variants: product.variants.map((v) => ({
      id: v.id,
      color_name: v.colorName,
      color_hex: v.colorHex,
      image_urls: v.images,
      stock_quantity: v.stock,
    })),
    specifications: product.specs.map((s, index) => ({
      spec_key: s.key,
      spec_value: s.value,
      group_name: s.group,
      sort_order: index,
    })),
  };
  vi.stubGlobal("fetch", vi.fn(async () => Response.json([row])));
  const [loaded] = await getProducts({ includeUnpublished: true });
  expect(loaded.createdAt).toBe("2026-10-06T00:00:00.000Z");
  expect(productSchema.safeParse({ ...loaded, price: loaded.price + 1 }).success).toBe(true);
});
