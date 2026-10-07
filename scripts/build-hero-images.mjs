import sharp from "sharp";
import { mkdir } from "node:fs/promises";

// Pre-encode the two initial banners so first visits never wait for AVIF encoding.
await mkdir("public/images/hero", { recursive: true });
for (const name of ["honda-sh350i", "vinfast-feliz-2025"]) {
  const result = await sharp(`public/images/products/${name}-0.webp`)
    .resize({ width: 900, withoutEnlargement: true })
    .avif({ quality: 55, effort: 6 })
    .toFile(`public/images/hero/${name}.avif`);
  console.log(`${name}: ${(result.size / 1024).toFixed(1)} KiB`);
  await sharp(`public/images/products/${name}-0.webp`)
    .resize({ width: 600, withoutEnlargement: true })
    .avif({ quality: 45, effort: 6 })
    .toFile(`public/images/hero/${name}-mobile.avif`);
}
