import type { Metadata } from "next";
import { OrderLookup } from "@/components/storefront/order-lookup";
export const metadata: Metadata = {
  title: "Tra cứu đơn hàng",
  robots: { index: false, follow: false },
};
export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ ma?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="container section">
      <div className="lookup-layout">
        <div className="page-intro">
          <span className="eyebrow">Theo dõi đặt xe</span>
          <h1 className="page-title">Tra cứu đơn hàng</h1>
          <p className="page-description">
            Xem tình trạng xác nhận và thanh toán bằng mã đơn cùng số điện thoại
            của bạn.
          </p>
        </div>
        <OrderLookup
          initialCode={typeof params.ma === "string" ? params.ma : ""}
        />
      </div>
    </div>
  );
}
