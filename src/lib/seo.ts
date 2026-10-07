import type { Product } from "@/types";
import { salePrice } from "./utils";
export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}
export function productSchema(product: Product) {
  const url = siteUrl() + "/xe/" + product.slug;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.id,
    brand: { "@type": "Brand", name: product.brand },
    image: product.variants
      .flatMap((v) => v.images)
      .map((image) => (image.startsWith("/") ? siteUrl() + image : image)),
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "VND",
      price: salePrice(product),
      availability:
        product.inStock && product.variants.some((variant) => variant.stock > 0)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    additionalProperty: product.specs.map((s) => ({
      "@type": "PropertyValue",
      name: s.key,
      value: s.value,
    })),
  };
}
export function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
