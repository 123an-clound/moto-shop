import type { Metadata } from "next";
import { MapPin, Clock, ArrowUpRight } from "lucide-react";
import { getProducts, getSettings } from "@/lib/repository";
import { TestDriveForm } from "@/components/storefront/test-drive";
export const metadata: Metadata = {
  alternates: { canonical: "/showroom" },
  title: "Showroom & đăng ký lái thử",
  description:
    "Đăng ký trải nghiệm xe máy tại MotoShop. Chọn mẫu xe, địa điểm và thời gian để nhân viên liên hệ xác nhận.",
};
export default async function ShowroomPage() {
  const [products, settings] = await Promise.all([
    getProducts(),
    getSettings(),
  ]);
  return (
    <div className="container section">
      <div className="page-intro">
        <span className="eyebrow">Trải nghiệm trước khi chọn</span>
        <h1 className="page-title">Hẹn gặp tại showroom</h1>
        <p className="page-description">
          Chọn mẫu xe bạn muốn trải nghiệm. Nhân viên sẽ liên hệ để xác nhận địa
          điểm, giờ hẹn và điều kiện lái thử.
        </p>
      </div>
      <div className="showroom-grid">
        <section>
          {settings.showrooms.map((s) => (
            <div key={s.id} className="panel mb-5">
              <MapPin size={30} className="mb-4 text-[var(--primary)]" />
              <h2>{s.name}</h2>
              <p className="page-description">{s.address}</p>
              <p className="helper mt-4">
                <Clock size={14} className="inline mr-2" />
                {s.hours}
              </p>
              {s.mapUrl && (
                <a
                  href={s.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link"
                >
                  Mở bản đồ <ArrowUpRight size={16} />
                </a>
              )}
            </div>
          ))}
          {settings.showrooms.length === 0 && (
            <div className="notice">Thông tin showroom đang được cập nhật.</div>
          )}
          {settings.contactPhone && (
            <p className="notice">
              Liên hệ tư vấn:{" "}
              <a className="underline" href={"tel:" + settings.contactPhone}>
                {settings.contactPhone}
              </a>
            </p>
          )}
        </section>
        <section className="panel">
          <h2>Đăng ký lái thử</h2>
          <TestDriveForm products={products} settings={settings} />
        </section>
      </div>
    </div>
  );
}
