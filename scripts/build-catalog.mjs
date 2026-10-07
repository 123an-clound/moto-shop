import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const metadataOnly = process.argv.includes("--metadata-only");
const requireComplete = process.argv.includes("--require-complete");
const imageDirectory = path.join(root, "public/images/products");
const featuredSlugs = new Set([
  "honda-air-blade-160",
  "honda-sh350i",
  "honda-vision",
  "yamaha-grande",
  "dat-bike-quantum-s1",
  "vinfast-evo-grand",
  "vinfast-feliz-2025",
  "yadea-velax-u",
]);

function uuid(key) {
  const hex = createHash("sha256")
    .update(`motoshop:${key}`)
    .digest("hex")
    .slice(0, 32)
    .split("");
  hex[12] = "5";
  hex[16] = ((parseInt(hex[16], 16) & 3) | 8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function numeric(value) {
  const match = String(value ?? "").match(/\d+(?:[.,]\d+)*/);
  if (!match) return null;
  const token = match[0];
  const result = /^\d{1,3}(?:[.,]\d{3})+$/.test(token)
    ? Number(token.replace(/[.,]/g, ""))
    : Number(token.replace(",", "."));
  return Number.isFinite(result) ? result : null;
}

function findSpecification(specifications, pattern) {
  return (
    Object.entries(specifications).find(([key]) => pattern.test(key))?.[1] ??
    null
  );
}

function specificationGroup(key) {
  if (/pin|sạc|ắc quy/i.test(key)) return "Pin & sạc";
  if (
    /kích thước|dài|rộng|cao|gầm|yên|trục|khối lượng|trọng lượng|khung|cốp/i.test(
      key,
    )
  )
    return "Kích thước";
  if (
    /phanh|lốp|phuộc|giảm xóc|đèn|quãng đường|tầm hoạt động|tốc độ|bảo hành/i.test(
      key,
    )
  )
    return "Vận hành";
  return "Động cơ";
}

function normalizedSlug(record) {
  if (record.slug === "honda-air-blade-160125") return "honda-air-blade-160";
  if (record.slug === "honda-sh160i125i") return "honda-sh160i";
  return record.slug;
}

function normalize(record) {
  if (record.type === "electric") {
    const namedColor = (name) => {
      if (/trắng/i.test(name)) return "#eeeae1";
      if (/đen/i.test(name)) return "#202127";
      if (/đỏ/i.test(name)) return "#b82735";
      if (/rêu|xanh lá/i.test(name)) return "#6b765a";
      if (/xanh/i.test(name)) return "#486779";
      if (/tím/i.test(name)) return "#857498";
      if (/xám|bạc/i.test(name)) return "#929599";
      if (/vàng/i.test(name)) return "#cbaf67";
      if (/cam/i.test(name)) return "#c36538";
      if (/hồng/i.test(name)) return "#cb97ab";
      return "#70747a";
    };
    record = {
      ...record,
      price_vnd: record.price,
      price_basis: record.priceNote,
      source_url: record.sourceUrl,
      checked_at: record.checkedAt,
      is_electric: true,
      specifications: {
        ...record.specs,
        ...(record.rangeNote
          ? { "Điều kiện đo quãng đường": record.rangeNote }
          : {}),
        ...(record.brakes ? { "Hệ thống phanh": record.brakes } : {}),
      },
      variants: record.variants
        .filter(
          (variant) =>
            variant.price === undefined || variant.price === record.price,
        )
        .map((variant) => ({
          color_name: variant.color,
          color_hex: namedColor(variant.color),
          image_urls: [variant.imageUrl],
        })),
    };
  }
  const slug = normalizedSlug(record);
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    throw new Error(`Invalid source slug: ${slug}`);
  if (!Number.isFinite(record.price_vnd) || record.price_vnd <= 0)
    throw new Error(`Missing verified price: ${slug}`);
  const specifications = record.specifications ?? {};
  const electric = record.is_electric === true;
  const engineCc = electric
    ? null
    : numeric(
        findSpecification(specifications, /dung tích (?:xy[- ]?|xi[- ]?)lanh/i),
      );
  const seatHeight = numeric(
    findSpecification(specifications, /(?:độ|chiều) cao yên/i),
  );
  const power = electric
    ? findSpecification(
        specifications,
        /công suất.*(?:động cơ|tối đa|danh định)|công suất/i,
      )
    : null;
  const powerNumber = numeric(power);
  const motorKw =
    electric && record.motorPowerKw !== undefined
      ? record.motorPowerKw
      : powerNumber === null
        ? null
        : /k\s*w/i.test(power)
          ? powerNumber
          : /w\b/i.test(power)
            ? powerNumber / 1000
            : null;
  const battery = electric
    ? findSpecification(
        specifications,
        /dung lượng pin|dung tích pin|năng lượng pin/i,
      )
    : null;
  const batteryKwh =
    electric && record.batteryKwh !== undefined
      ? record.batteryKwh
      : battery && /kwh/i.test(battery)
        ? numeric(battery)
        : null;
  const rangeKm =
    electric && record.rangeKm !== undefined
      ? record.rangeKm
      : electric
        ? numeric(
            findSpecification(
              specifications,
              /quãng đường|tầm hoạt động|phạm vi hoạt động/i,
            ),
          )
        : null;
  const brakeValues = Object.entries(specifications)
    .filter(([key]) => /phanh/i.test(key))
    .map(([, value]) => value)
    .join(" ");
  const brake = /ABS/i.test(`${record.name} ${brakeValues}`)
    ? "ABS"
    : /CBS/i.test(brakeValues)
      ? "CBS"
      : "";
  const summary = [
    electric ? "Xe máy điện" : "Xe máy xăng",
    engineCc === null
      ? null
      : `dung tích ${engineCc.toLocaleString("vi-VN")} cc`,
    motorKw === null ? null : `công suất ${motorKw.toLocaleString("vi-VN")} kW`,
    rangeKm === null
      ? null
      : `quãng đường công bố ${rangeKm.toLocaleString("vi-VN")} km`,
    seatHeight === null ? null : `chiều cao yên ${seatHeight} mm`,
  ]
    .filter(Boolean)
    .join(", ");
  const variants = record.variants.map((variant) => ({
    id: uuid(`${slug}:${variant.color_name}`),
    colorName: variant.color_name,
    colorHex: variant.color_hex,
    images: [...variant.image_urls],
    stock: 10,
  }));
  if (!variants.length || variants.some((variant) => !variant.images.length))
    throw new Error(`Missing verified color image: ${slug}`);
  return {
    id: uuid(slug),
    slug,
    name: record.name,
    brand: record.brand,
    type: electric ? "electric" : "gasoline",
    price: record.price_vnd,
    salePrice: null,
    description: `${summary}.${record.rangeNote ? ` ${record.rangeNote}` : ""} Thông số và giá tham khảo theo phiên bản hãng công bố.`,
    featured: featuredSlugs.has(slug),
    inStock: true,
    published: true,
    createdAt: `${record.checked_at}T00:00:00.000Z`,
    engineCc,
    motorKw,
    batteryKwh,
    rangeKm,
    seatHeight,
    brake,
    variants,
    specs: Object.entries(specifications).map(([key, value]) => ({
      key,
      value,
      group: specificationGroup(key),
    })),
    sourceUrl: record.source_url,
    sourceDate: record.checked_at,
    priceNote: record.price_basis,
  };
}

async function readResearch(filename, optional = false) {
  try {
    const records = JSON.parse(
      await readFile(path.join(root, "docs", filename), "utf8"),
    );
    if (!Array.isArray(records))
      throw new Error(`${filename} must contain a JSON array`);
    return records;
  } catch (error) {
    if (optional && error.code === "ENOENT") return [];
    throw error;
  }
}

async function optimizeImage(url, destination) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok)
    throw new Error(`Image download failed (${response.status}): ${url}`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/"))
    throw new Error(`Unexpected image content type ${contentType}: ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await sharp(buffer)
    .trim({ threshold: 8 })
    .resize({
      width: 1000,
      height: 1000,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toFile(destination);
  const metadata = await sharp(destination).metadata();
  const { size } = await stat(destination);
  if (
    metadata.format !== "webp" ||
    !metadata.width ||
    !metadata.height ||
    metadata.width > 1000 ||
    metadata.height > 1000 ||
    size > 750000
  ) {
    throw new Error(
      `Invalid optimized image: ${destination} (${metadata.width}x${metadata.height}, ${size} bytes)`,
    );
  }
  return size;
}

async function main() {
  const records = [
    ...(await readResearch("research-gasoline.json")),
    ...(await readResearch("research-electric.json", true)),
  ];
  if (requireComplete && records.length !== 30)
    throw new Error(`Expected 30 verified products; found ${records.length}`);
  const products = records.map(normalize);
  if (new Set(products.map((product) => product.slug)).size !== products.length)
    throw new Error("Duplicate product slug");
  await mkdir(path.join(root, "src/data"), { recursive: true });
  await mkdir(imageDirectory, { recursive: true });
  let totalBytes = 0;
  if (!metadataOnly) {
    for (const product of products) {
      let imageIndex = 0;
      for (const variant of product.variants) {
        const localImages = [];
        for (const source of variant.images) {
          const filename = `${product.slug}-${imageIndex++}.webp`;
          totalBytes += await optimizeImage(
            source,
            path.join(imageDirectory, filename),
          );
          localImages.push(`/images/products/${filename}`);
        }
        variant.images = localImages;
      }
      console.log(`Verified images: ${product.slug}`);
    }
  }
  await writeFile(
    path.join(root, "src/data/products.json"),
    `${JSON.stringify(products, null, 2)}\n`,
  );
  const lines = [
    "# Nguồn dữ liệu sản phẩm MotoShop Việt Nam",
    "",
    "Dữ liệu ban đầu được kiểm tra ngày 06/10/2026 từ trang chính thức của Honda, Yamaha, VinFast, Dat Bike và YADEA. Đây là danh mục tham khảo để chủ cửa hàng chỉnh sửa trong admin.",
    "",
    "Giá là mức hãng công bố tại trang nguồn của phiên bản tương ứng, chưa bao gồm chi phí lăn bánh trừ khi ghi rõ. Không tạo giá khuyến mãi, đánh giá khách hàng hoặc số liệu bán hàng. Các thông số thiếu ở nguồn được để trống.",
    "",
    "**Giả định dữ liệu chạy thử:** mỗi màu có 10 xe trong tồn kho, sản phẩm được xuất bản và có trạng thái còn hàng để kiểm thử quy trình đặt xe. Đây không phải tồn kho thực của nhà sản xuất hoặc MotoShop. Chủ cửa hàng cần cập nhật tồn kho, giá bán và thông tin hoạt động trước khi nhận đơn thật.",
    "",
    "Ảnh sản phẩm được tải từ các URL chính thức, giữ nguyên màu và nội dung, cắt khoảng trống ở viền khi có thể và chuyển sang WebP tối đa 1000 px. URL ảnh gốc và chứng cứ thông số được giữ trong `research-gasoline.json` và `research-electric.json`. Chấm màu xe điện là biểu diễn gần đúng theo tên màu, không phải mã sơn hãng. Quyền đối với hình ảnh và nhãn hiệu thuộc chủ sở hữu tương ứng.",
    "",
    "Dat Bike Quantum S1/S2/S3 có màu trắng giá cao hơn 1.000.000 đồng so với màu cơ sở. Vì mô hình hiện tại dùng một giá cho mỗi sản phẩm, danh mục khởi tạo chỉ nhập các màu cùng giá cơ sở; dữ liệu màu trắng vẫn được giữ nguyên trong file nghiên cứu. Quãng đường công bố của một số VinFast yêu cầu pin phụ tùy chọn; điều kiện này được ghi rõ trong mô tả và thông số, không có nghĩa pin phụ nằm trong giá cơ sở.",
    "",
    "| Sản phẩm / phiên bản | Giá tham khảo (VNĐ) | Nguồn |",
    "| --- | ---: | --- |",
    ...products.map(
      (product) =>
        `| ${product.name.replaceAll("|", "\\|")} | ${product.price.toLocaleString("vi-VN")} | [${product.brand}](${product.sourceUrl}) |`,
    ),
    "",
    "## Tạo lại danh mục",
    "",
    "Chạy `node scripts/build-catalog.mjs --require-complete` sau khi cập nhật hai file nghiên cứu. Lệnh sẽ tải lại ảnh, xác nhận ảnh giải mã được, chuẩn hóa Product DTO và giữ UUID ổn định theo slug/màu. Nếu nguồn ảnh lỗi, lệnh dừng với thông báo lỗi; danh mục đã có không bị ghi đè bằng ảnh thiếu.",
    "",
    "Chạy `node scripts/build-catalog.mjs --metadata-only` chỉ để chuẩn hóa dữ liệu trong lúc phát triển. Chế độ này giữ URL ảnh nguồn và không được dùng làm danh mục phát hành.",
    "",
  ];
  await writeFile(path.join(root, "docs/catalog-sources.md"), lines.join("\n"));
  console.log(
    `Saved ${products.length} products; optimized images ${(totalBytes / 1024 / 1024).toFixed(2)} MiB.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
