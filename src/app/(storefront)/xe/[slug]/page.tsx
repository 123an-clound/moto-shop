import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { getProduct, getProducts, getSettings } from "@/lib/repository";
import { ProductDetail } from "@/components/storefront/product-detail";
import { ProductCard } from "@/components/storefront/product-card";
import { productSchema, safeJsonLd, siteUrl } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return { title: "Không tìm thấy xe" };
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: siteUrl() + "/xe/" + product.slug },
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.variants[0]?.images[0]
        ? [product.variants[0].images[0]]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
      images: product.variants[0]?.images[0]
        ? [product.variants[0].images[0]]
        : [],
    },
  };
}
export default async function DetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const [product, products, settings] = await Promise.all([
    getProduct(slug),
    getProducts(),
    getSettings(),
  ]);
  if (!product) notFound();
  const related = products
    .filter((p) => p.type === product.type && p.id !== product.id)
    .slice(0, 4);
  const accessories = products
    .filter((p) => p.type === "accessory")
    .slice(0, 4);
  return (
    <div className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productSchema(product)) }}
      />
      <div className="breadcrumb">
        <Link href="/">Trang chủ</Link>
        <ChevronRight size={12} />
        <Link href="/xe">Bộ sưu tập xe</Link>
        <ChevronRight size={12} />
        <span>{product.name}</span>
      </div>
      <ProductDetail product={product} settings={settings} />
      <section className="section pt-0">
        <div className="section-heading">
          <h2>Thêm lựa chọn cho bạn</h2>
          <Link href={"/xe?loai=" + product.type} className="text-link">
            Xem tất cả <ArrowRight size={17} />
          </Link>
        </div>
        <div className="product-grid">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      {accessories.length > 0 && (
        <section className="section pt-0">
          <h2 className="mb-7">Phụ kiện đi cùng</h2>
          <div className="product-grid">
            {accessories.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
