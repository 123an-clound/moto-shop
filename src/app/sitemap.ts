import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/repository";
import { siteUrl } from "@/lib/seo";
import { articles } from "@/lib/articles";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  if (!base.startsWith("https://")) return [];
  const products = await getProducts();
  return [
    ...["", "/xe", "/showroom", "/tin-tuc", "/chinh-sach"].map((path) => ({
      url: base + path,
    })),
    ...products.map((p) => ({ url: base + "/xe/" + p.slug })),
    ...articles.map((a) => ({ url: base + "/tin-tuc/" + a.slug })),
  ];
}
