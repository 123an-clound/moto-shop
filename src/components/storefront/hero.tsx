"use client";
import Link from "next/link";
import Image from "@/components/storefront/image";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, CheckCircle2 } from "lucide-react";
import type { Product, SiteSettings } from "@/types";
import { formatPrice, salePrice } from "@/lib/utils";
const mobileBanners: Record<string, string> = {
  "/images/hero/honda-sh350i.avif": "/images/hero/honda-sh350i-mobile.avif",
  "/images/hero/vinfast-feliz-2025.avif":
    "/images/hero/vinfast-feliz-2025-mobile.avif",
};
export function Hero({
  products,
  settings,
}: {
  products: Product[];
  settings: SiteSettings;
}) {
  const [index, setIndex] = useState(0);
  const banners = settings.heroBanners;
  const banner = banners[index % banners.length];
  const hero =
    products.find((p) => p.slug === banner?.href.split("/").at(-1)) ||
    products.find((p) =>
      index === 0 ? p.slug === "honda-sh350i" : p.type === "electric",
    ) ||
    products[0];
  const image = banner?.image || hero?.variants[0]?.images[0];
  const title = (banner?.title || "Chọn xe.\nChọn chất riêng.").split("\n");
  return (
    <section className="hero container" aria-label="Bộ sưu tập xe MotoShop">
      <div className="hero-copy">
        <div className="eyebrow">Một hành trình mới bắt đầu</div>
        <h1>
          {title[0]}
          <br />
          <em>{title.slice(1).join("\n")}</em>
        </h1>
        <p>
          {banner?.subtitle ||
            "Tìm chiếc xe phù hợp với bạn, từ nhịp phố mỗi ngày đến những cung đường mới."}
        </p>
        <div className="hero-actions">
          <Link href="/xe" className="btn">
            Khám phá bộ sưu tập <ArrowRight size={17} />
          </Link>
          <Link href="/showroom" className="btn btn-outline">
            Đăng ký lái thử <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="hero-sub">
          <CheckCircle2 size={15} /> Thông số rõ ràng. Trải nghiệm trước khi
          chọn.
        </div>
        <div className="hero-progress">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={"Xem banner " + (i + 1)}
              aria-pressed={index === i}
              onClick={() => setIndex(i)}
            >
              {String(i + 1).padStart(2, "0")}
            </button>
          ))}
          <span>BỘ SƯU TẬP / {new Date().getFullYear()}</span>
        </div>
      </div>
      <div className="hero-visual">
        <div className="hero-series">
          <i />
          {banner?.label || hero?.brand.toUpperCase()}
          <span>•</span> PHONG CÁCH CỦA BẠN
        </div>
        <span className="hero-watermark" aria-hidden="true">
          {hero?.slug === "honda-sh350i"
            ? "SH350i"
            : hero?.type === "electric"
              ? "ELECTRIC"
              : hero?.brand.toUpperCase() || "MOTOSHOP"}
        </span>
        <div className="hero-bike">
          {image && (
            <picture>
              {mobileBanners[image] && (
                <source
                  media="(max-width:767px)"
                  srcSet={mobileBanners[image]}
                />
              )}
              <Image
                key={image}
                src={image}
                alt={hero?.name || "Xe máy tại MotoShop"}
                fill
                sizes="(max-width:767px) 70vw,(max-width:1100px) 45vw,550px"
                unoptimized={image.endsWith(".avif")}
                loading="eager"
                fetchPriority="high"
              />
            </picture>
          )}
        </div>
        <div className="hero-product">
          <div>
            <span>{hero?.name}</span>
            <strong>{hero && formatPrice(salePrice(hero))}</strong>
          </div>
          <Link href={banner?.href || "/xe"} aria-label="Xem xe trong banner">
            <ArrowUpRight size={21} />
          </Link>
        </div>
      </div>
    </section>
  );
}
