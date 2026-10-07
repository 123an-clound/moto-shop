import Link from "next/link";
import Image from "@/components/storefront/image";
import { ArrowUpRight, Zap, Gauge, Ruler } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice, salePrice } from "@/lib/utils";
export function ProductCard({ product }: { product: Product }) {
  const variant = product.variants[0];
  return (
    <article className="product-card">
      <Link
        href={"/xe/" + product.slug}
        className="product-photo"
        aria-label={"Xem " + product.name}
      >
        <span
          className={
            "product-badge " + (product.type === "electric" ? "electric" : "")
          }
        >
          {product.type === "electric" ? (
            <>
              <Zap size={11} /> XE ĐIỆN
            </>
          ) : product.salePrice !== null ? (
            "ƯU ĐÃI"
          ) : product.type === "accessory" ? (
            "PHỤ KIỆN"
          ) : (
            "XE XĂNG"
          )}
        </span>
        {variant?.images[0] && (
          <Image
            src={variant.images[0]}
            alt={product.name + " màu " + variant.colorName}
            fill
            sizes="(max-width:767px) 45vw,(max-width:1100px) 30vw,300px"
          />
        )}
        <span className="product-arrow">
          <ArrowUpRight size={15} />
        </span>
      </Link>
      <div className="product-info">
        <span className="product-brand">{product.brand}</span>
        <h3>
          <Link href={"/xe/" + product.slug}>{product.name}</Link>
        </h3>
        <div className="product-price">
          {formatPrice(salePrice(product))}
          {product.salePrice !== null && (
            <del>{formatPrice(product.price)}</del>
          )}
        </div>
        <div className="product-specs">
          {product.type === "electric" ? (
            <>
              {product.motorKw !== null && (
                <span>
                  <Zap size={12} />
                  {product.motorKw} kW
                </span>
              )}
              {product.batteryKwh !== null && (
                <span>{product.batteryKwh} kWh</span>
              )}
            </>
          ) : (
            <>
              {product.engineCc !== null && (
                <span>
                  <Gauge size={12} />
                  {product.engineCc} cc
                </span>
              )}
              {product.seatHeight !== null && (
                <span>
                  <Ruler size={12} />
                  {product.seatHeight} mm
                </span>
              )}
            </>
          )}
        </div>
        <div
          className="color-dots"
          aria-label={product.variants.length + " màu xe"}
        >
          {product.variants.slice(0, 6).map((v) => (
            <span
              key={v.id}
              style={{ background: v.colorHex }}
              title={v.colorName}
            />
          ))}
        </div>
      </div>
    </article>
  );
}
