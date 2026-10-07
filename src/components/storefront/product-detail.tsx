"use client";
import Link from "next/link";
import Image from "@/components/storefront/image";
import { useState } from "react";
import {
  ShoppingBag,
  CheckCircle2,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import type { Product, SiteSettings } from "@/types";
import { formatPrice, salePrice } from "@/lib/utils";
import { calculateInstallment } from "@/lib/installment";
import { useCart } from "./providers";
import { TestDriveDialog } from "./test-drive";
export function ProductDetail({
  product,
  settings,
}: {
  product: Product;
  settings: SiteSettings;
}) {
  const [variantIndex, setVariantIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [down, setDown] = useState(30);
  const [months, setMonths] = useState(12);
  const [rate, setRate] = useState(settings.annualInterestRate);
  const { add } = useCart();
  const variant = product.variants[variantIndex];
  const price = salePrice(product);
  const estimate = calculateInstallment(price, down, months, rate);
  const groups = Array.from(
    new Set(product.specs.map((s) => s.group || "Thông số chung")),
  );
  const available = product.inStock && variant?.stock > 0;
  return (
    <>
      <div className="detail-layout">
        <div>
          <div className="detail-photo">
            {variant?.images[imageIndex] && (
              <Image
                src={variant.images[imageIndex]}
                alt={
                  product.name +
                  " màu " +
                  variant.colorName +
                  ", ảnh " +
                  (imageIndex + 1)
                }
                fill
                sizes="(max-width:767px) 90vw,700px"
                preload
              />
            )}
          </div>
          <div className="image-thumbnails">
            {variant?.images.map((img, i) => (
              <button
                type="button"
                key={img}
                aria-label={
                  "Xem ảnh " + (i + 1) + " của màu " + variant.colorName
                }
                aria-pressed={i === imageIndex}
                onClick={() => setImageIndex(i)}
              >
                <Image src={img} alt="" fill sizes="90px" />
              </button>
            ))}
          </div>
        </div>
        <div className="detail-info">
          <div className="product-brand">
            {product.brand} /{" "}
            {product.type === "electric"
              ? "XE MÁY ĐIỆN"
              : product.type === "gasoline"
                ? "XE MÁY XĂNG"
                : "PHỤ KIỆN"}
          </div>
          <h1>{product.name}</h1>
          <div className="detail-price">
            {formatPrice(price)}
            {product.salePrice !== null && (
              <del>{formatPrice(product.price)}</del>
            )}
          </div>
          <p className="helper">
            {product.priceNote ||
              "Giá tham khảo; giá cuối cùng được xác nhận khi đặt xe."}
          </p>
          <p className="detail-description">{product.description}</p>
          <div className="detail-highlights">
            {product.type === "electric" ? (
              <>
                {product.motorKw !== null && (
                  <div>
                    <strong>{product.motorKw} kW</strong>
                    <span>Công suất hãng công bố</span>
                  </div>
                )}
                {product.batteryKwh !== null && (
                  <div>
                    <strong>{product.batteryKwh} kWh</strong>
                    <span>Dung lượng pin</span>
                  </div>
                )}
                {product.rangeKm !== null && (
                  <div>
                    <strong>{product.rangeKm} km</strong>
                    <span>Quãng đường theo điều kiện hãng</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {product.engineCc !== null && (
                  <div>
                    <strong>{product.engineCc} cc</strong>
                    <span>Dung tích động cơ</span>
                  </div>
                )}
                {product.seatHeight !== null && (
                  <div>
                    <strong>{product.seatHeight} mm</strong>
                    <span>Chiều cao yên</span>
                  </div>
                )}
                {product.brake && (
                  <div>
                    <strong>{product.brake}</strong>
                    <span>Hệ thống phanh</span>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="variant-picker">
            <p>
              Màu xe: <strong>{variant?.colorName}</strong>
            </p>
            <div>
              {product.variants.map((v, i) => (
                <button
                  type="button"
                  key={v.id}
                  title={v.colorName}
                  aria-label={"Chọn màu " + v.colorName}
                  aria-pressed={i === variantIndex}
                  onClick={() => {
                    setVariantIndex(i);
                    setImageIndex(0);
                    setAdded(false);
                  }}
                >
                  <span style={{ background: v.colorHex }} />
                </button>
              ))}
            </div>
          </div>
          <p className="stock-text">
            <CheckCircle2 size={14} />
            {available
              ? "Nhận đặt xe • Nhân viên xác nhận tồn kho"
              : "Tạm hết xe ở màu này • Có thể đăng ký lái thử"}
          </p>
          <div className="detail-ctas">
            <button
              className="btn"
              type="button"
              disabled={!available}
              onClick={() => {
                add({
                  productId: product.id,
                  variantId: variant.id,
                  quantity: 1,
                });
                setAdded(true);
              }}
            >
              <ShoppingBag size={17} />
              {added ? "Đã thêm vào giỏ" : "Đặt xe trực tuyến"}
            </button>
            <TestDriveDialog product={product} settings={settings} />
          </div>
          {added && (
            <div className="notice success mt-4" role="status">
              Đã thêm màu {variant.colorName}.{" "}
              <Link href="/gio-hang" className="underline font-semibold">
                Xem giỏ & đặt xe <ArrowRight size={13} className="inline" />
              </Link>
            </div>
          )}
          <p className="source-note">
            {product.sourceUrl && (
              <>
                <a
                  href={product.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Xem thông tin nhà sản xuất
                </a>{" "}
                •{" "}
              </>
            )}
            {product.sourceDate &&
              "Dữ liệu tham khảo ngày " +
                new Intl.DateTimeFormat("vi-VN").format(
                  new Date(product.sourceDate),
                )}
            <br />
            Nhân viên xác nhận giá, phiên bản, tồn kho và chi phí lăn bánh khi
            đặt xe.
          </p>
        </div>
      </div>
      <div className="detail-panels">
        <section className="panel">
          <h2>Thông số kỹ thuật</h2>
          <div className="spec-groups">
            {groups.map((group, i) => (
              <details key={group} open={i === 0}>
                <summary>{group}</summary>
                <dl>
                  {product.specs
                    .filter((s) => (s.group || "Thông số chung") === group)
                    .map((s, j) => (
                      <div key={j}>
                        <dt>{s.key}</dt>
                        <dd>{s.value}</dd>
                      </div>
                    ))}
                </dl>
              </details>
            ))}
          </div>
          {!groups.length && (
            <p className="notice">Thông số đang được cập nhật.</p>
          )}
          <p className="helper">
            Thông số do hãng công bố theo phiên bản. Điều kiện đo và trang bị có
            thể khác theo cấu hình.
          </p>
        </section>
        <section className="panel" id="tra-gop">
          <h2>Ước tính trả góp</h2>
          <p className="helper mb-5">
            Dự tính khoản thanh toán theo dư nợ giảm dần. Không phải đề nghị cấp
            tín dụng.
          </p>
          <label className="field-label" htmlFor="down">
            Trả trước: {down}% · {formatPrice(estimate.downPayment)}
          </label>
          <input
            className="range-field"
            id="down"
            type="range"
            min="10"
            max="100"
            step="5"
            value={down}
            onChange={(e) => setDown(Number(e.target.value))}
          />
          <div className="form-grid">
            <div className="form-field">
              <label className="field-label" htmlFor="months">
                Kỳ hạn
              </label>
              <select
                id="months"
                className="field"
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
              >
                {[6, 12, 24].map((m) => (
                  <option key={m} value={m}>
                    {m} tháng
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="rate">
                Lãi suất năm (%)
              </label>
              <input
                id="rate"
                className="field"
                type="number"
                min="0"
                max="100"
                step=".1"
                value={rate}
                onChange={(e) =>
                  setRate(Math.min(100, Math.max(0, Number(e.target.value))))
                }
              />
            </div>
          </div>
          <div className="installment-result" aria-live="polite">
            <span>Khoản trả mỗi tháng dự kiến</span>
            <strong>{formatPrice(estimate.monthlyPayment)}</strong>
            <p>
              Số tiền vay: {formatPrice(estimate.principal)}
              <br />
              Lãi dự kiến toàn kỳ: {formatPrice(estimate.totalInterest)}
            </p>
          </div>
          <p className="helper mt-4">
            Chưa gồm phí hồ sơ, bảo hiểm và chi phí đăng ký. Lãi suất{" "}
            {settings.annualInterestRate}%/năm mặc định là giả định minh họa;
            điều kiện thực tế cần được đơn vị cho vay xác nhận.
          </p>
          <Link href="/showroom" className="text-link">
            <CalendarDays size={16} />
            Đăng ký tư vấn mua xe <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </>
  );
}
