import { createClient } from "@supabase/supabase-js";
import products from "../src/data/products.json";
import settings from "../src/data/settings.json";

async function main() {
  try {
    process.loadEnvFile?.(".env.local");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret)
    throw new Error(
      "Cần NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY trong .env.local.",
    );
  const client = createClient(url, secret, { auth: { persistSession: false } });
  const { count, error: checkError } = await client
    .from("moto_products")
    .select("id", { count: "exact", head: true });
  if (checkError)
    throw new Error("Chưa có schema. Hãy chạy migration trước khi seed.");
  if (count && process.env.SEED_ALLOW_OVERWRITE !== "true")
    throw new Error(
      "Database đã có sản phẩm. Chỉ seed database mới; đặt SEED_ALLOW_OVERWRITE=true nếu chủ động muốn cập nhật toàn bộ dữ liệu mẫu.",
    );
  for (const product of products) {
    const { error } = await client.rpc("moto_upsert_product", {
      p_product: product,
    });
    if (error)
      throw new Error(
        `Không seed được ${product.slug}: ${error.code || "database error"}`,
      );
  }
  const { error } = await client
    .from("moto_site_settings")
    .upsert({
      id: 1,
      site_name: settings.siteName,
      primary_color: settings.primaryColor,
      logo_url: settings.logoUrl,
      contact_phone: settings.contactPhone,
      address: settings.address,
      hero_banners: settings.heroBanners,
      config: settings,
    });
  if (error) throw new Error("Không seed được cấu hình cửa hàng.");
  console.log(
    `Đã nhập ${products.length} sản phẩm và cấu hình cửa hàng vào Supabase.`,
  );
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Seed thất bại.");
  process.exitCode = 1;
});
