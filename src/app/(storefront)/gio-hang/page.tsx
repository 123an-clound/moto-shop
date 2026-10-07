import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getProducts, getSettings } from "@/lib/repository";
import { Cart } from "@/components/storefront/cart";
export const metadata: Metadata = {
  title: "Giỏ hàng & đặt xe",
  robots: { index: false, follow: false },
};
export default async function CartPage() {
  const [products, settings] = await Promise.all([
    getProducts(),
    getSettings(),
  ]);
  return (
    <div className="container">
      <div className="breadcrumb">
        <Link href="/">Trang chủ</Link>
        <ChevronRight size={12} />
        <span>Giỏ hàng</span>
      </div>
      <div className="page-intro">
        <h1 className="page-title">Giỏ hàng của bạn</h1>
        <p className="page-description">
          Kiểm tra mẫu xe, màu sắc và thông tin liên hệ trước khi đặt.
        </p>
      </div>
      <Cart products={products} settings={settings} />
    </div>
  );
}
