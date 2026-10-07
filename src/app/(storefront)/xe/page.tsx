import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getProducts, getSalesCounts } from "@/lib/repository";
import { Catalog } from "@/components/storefront/catalog";
export const metadata: Metadata = {
  alternates: { canonical: "/xe" },
  title: "Bộ sưu tập xe máy & xe điện",
  description:
    "Khám phá các mẫu Honda, Yamaha, VinFast, YADEA và Dat Bike. Lọc xe theo giá, công suất, phân khối và nhu cầu.",
};
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, products, sales] = await Promise.all([
    searchParams,
    getProducts(),
    getSalesCounts(),
  ]);
  const value = (k: string) =>
    typeof params[k] === "string" ? (params[k] as string) : "";
  const initial = {
    type: value("loai"),
    brand: value("hang"),
    search: value("tim"),
    budget: value("gia"),
    cc: value("cc"),
    power: value("kw"),
    range: value("km"),
    seat: value("yen"),
    brake: value("phanh"),
    sort: value("sap-xep") || "featured",
  };
  return (
    <div className="container">
      <div className="breadcrumb">
        <Link href="/">Trang chủ</Link>
        <ChevronRight size={12} />
        <span>Bộ sưu tập xe</span>
      </div>
      <div className="page-intro">
        <span className="eyebrow">Tìm chiếc xe của bạn</span>
        <h1 className="page-title">
          {initial.type === "electric"
            ? "Xe máy điện"
            : initial.type === "gasoline"
              ? "Xe máy xăng"
              : "Bộ sưu tập xe"}
        </h1>
        <p className="page-description">
          Mỗi hành trình có một chiếc xe phù hợp. Chọn theo thương hiệu, ngân
          sách và những điều bạn cần.
        </p>
      </div>
      <Catalog
        key={JSON.stringify(initial)}
        products={products}
        initial={initial}
        sales={sales}
      />
    </div>
  );
}
