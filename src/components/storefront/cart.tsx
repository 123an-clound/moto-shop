"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "@/components/storefront/image";
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import type { Product, SiteSettings, Order } from "@/types";
import { useCart } from "./providers";
import { formatPrice, salePrice } from "@/lib/utils";
import { api } from "@/lib/client-api";
type Receipt = {
  order: Pick<
    Order,
    | "id"
    | "code"
    | "total"
    | "deposit"
    | "items"
    | "paymentMethod"
    | "status"
    | "paymentStatus"
  >;
  qrUrl?: string;
};
export function Cart({
  products,
  settings,
}: {
  products: Product[];
  settings: SiteSettings;
}) {
  const { items, remove, update, clear } = useCart();
  const [method, setMethod] = useState<"cod" | "bank">("cod");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const requestRef = useRef({ body: "", key: "" });
  const bankReady = !!(
    settings.bankBin &&
    settings.bankAccount &&
    settings.bankName
  );
  const lines = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      item,
      product,
      variant: product?.variants.find((v) => v.id === item.variantId),
    };
  });
  const invalid = lines.some(
    ({ item, product, variant }) =>
      !product || !product.inStock || !variant || variant.stock < item.quantity,
  );
  const total = lines.reduce(
    (sum, { item, product }) =>
      sum + (product ? salePrice(product) * item.quantity : 0),
    0,
  );
  const deposit =
    method === "bank" ? Math.ceil((total * settings.depositPercent) / 100) : 0;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (invalid || busy) return;
    setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    delete values.consent;
    const body = JSON.stringify({ ...values, paymentMethod: method, items });
    if (requestRef.current.body !== body)
      requestRef.current = { body, key: crypto.randomUUID() };
    setBusy(true);
    try {
      const result = await api<Receipt>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          ...JSON.parse(body),
          idempotencyKey: requestRef.current.key,
        }),
      });
      setReceipt(result);
      clear();
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (receipt)
    return (
      <div className="order-success">
        <CheckCircle2 size={44} className="text-green-700" />
        <h1>Đã nhận yêu cầu đặt xe</h1>
        <p className="page-description">
          Lưu mã đơn bên dưới. Nhân viên sẽ liên hệ để xác nhận phiên bản, tồn
          kho, giá và phương thức nhận xe.
        </p>
        <div className="order-code" data-testid="order-code">
          {receipt.order.code}
        </div>
        <div className="panel">
          <h2>Thông tin đặt xe</h2>
          {receipt.order.items.map((i, index) => (
            <div key={index} className="summary-row">
              <span>
                {i.name}
                <small className="block helper">
                  {i.color} · Số lượng {i.quantity}
                </small>
              </span>
              <strong>{formatPrice(i.unitPrice * i.quantity)}</strong>
            </div>
          ))}
          <div className="summary-row total">
            <span>Tổng giá xe</span>
            <span>{formatPrice(receipt.order.total)}</span>
          </div>
          <div className="summary-row">
            <span>Trạng thái thanh toán</span>
            <strong>Chưa thanh toán</strong>
          </div>
          {receipt.qrUrl ? (
            <>
              <div className="summary-row deposit">
                <span>Số tiền đặt cọc</span>
                <span>{formatPrice(receipt.order.deposit)}</span>
              </div>
              <Image
                src={receipt.qrUrl}
                alt={"Mã VietQR đặt cọc cho đơn " + receipt.order.code}
                width={300}
                height={350}
                unoptimized
                className="mx-auto mt-5"
              />
              <p className="helper">
                Kiểm tra tên người nhận, số tiền và nội dung{" "}
                {receipt.order.code} trong ứng dụng ngân hàng. Việc mở mã QR
                chưa xác nhận đã thanh toán.
              </p>
            </>
          ) : (
            <p className="notice mt-5">
              Thanh toán khi nhận xe hoặc tại showroom sau khi nhân viên xác
              nhận. Chưa thu tiền trực tuyến cho đơn này.
            </p>
          )}
        </div>
        <Link className="btn mt-6" href={"/tra-cuu?ma=" + receipt.order.code}>
          Tra cứu trạng thái đơn <ArrowRight size={17} />
        </Link>
      </div>
    );
  if (!items.length)
    return (
      <div className="empty-state mb-16">
        <ShoppingBag size={45} />
        <h2>Giỏ hàng đang trống</h2>
        <p>Chọn mẫu xe và màu bạn yêu thích để bắt đầu đặt xe.</p>
        <Link className="btn" href="/xe">
          Khám phá các mẫu xe <ArrowRight size={17} />
        </Link>
      </div>
    );
  return (
    <div className="cart-layout">
      <section>
        <h2 className="text-xl mb-3">Xe bạn đã chọn</h2>
        {lines.map(({ item, product, variant }) => (
          <article className="cart-row" key={item.productId + item.variantId}>
            <div className="cart-row-image">
              {variant?.images[0] && (
                <Image
                  src={variant.images[0]}
                  alt={product?.name || "Xe đã chọn"}
                  fill
                  sizes="130px"
                />
              )}
            </div>
            <div>
              {product ? (
                <h2>
                  <Link href={"/xe/" + product.slug}>{product.name}</Link>
                </h2>
              ) : (
                <h2>Sản phẩm không còn trong danh mục</h2>
              )}
              <p>{variant?.colorName || "Màu xe không còn được bán"}</p>
              {product && <strong>{formatPrice(salePrice(product))}</strong>}
              <div className="quantity-control">
                <button
                  type="button"
                  aria-label={"Giảm số lượng " + product?.name}
                  disabled={busy || item.quantity <= 1}
                  onClick={() =>
                    update(item.productId, item.variantId, item.quantity - 1)
                  }
                >
                  <Minus size={14} className="mx-auto" />
                </button>
                <span aria-label="Số lượng">{item.quantity}</span>
                <button
                  type="button"
                  aria-label={"Tăng số lượng " + product?.name}
                  disabled={
                    busy || item.quantity >= Math.min(10, variant?.stock ?? 0)
                  }
                  onClick={() =>
                    update(item.productId, item.variantId, item.quantity + 1)
                  }
                >
                  <Plus size={14} className="mx-auto" />
                </button>
              </div>
              {(!product?.inStock ||
                !variant ||
                variant.stock < item.quantity) && (
                <p className="text-red-700">
                  Xe không đủ số lượng. Hãy giảm số lượng hoặc xóa khỏi giỏ.
                </p>
              )}
            </div>
            <button
              className="icon-button"
              type="button"
              disabled={busy}
              aria-label={"Xóa " + product?.name + " khỏi giỏ"}
              onClick={() => remove(item.productId, item.variantId)}
            >
              <Trash2 size={18} />
            </button>
          </article>
        ))}
        <div className="notice mt-6">
          <ShieldCheck size={18} className="inline mr-2" />
          Giá xe chưa bao gồm chi phí lăn bánh và giao xe. Nhân viên sẽ xác nhận
          tổng chi phí trước khi chốt đơn.
        </div>
        <Link href="/xe" className="text-link mt-3">
          Tiếp tục chọn xe <ArrowRight size={16} />
        </Link>
      </section>
      <section className="panel">
        <h2>Thông tin đặt xe</h2>
        <form onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="checkout-name" className="field-label">
              Họ và tên *
            </label>
            <input
              id="checkout-name"
              name="fullName"
              className="field"
              minLength={2}
              maxLength={120}
              autoComplete="name"
              required
              disabled={busy}
            />
          </div>
          <div className="form-field">
            <label htmlFor="checkout-phone" className="field-label">
              Số điện thoại *
            </label>
            <input
              id="checkout-phone"
              name="phone"
              className="field"
              type="tel"
              maxLength={25}
              autoComplete="tel"
              required
              disabled={busy}
            />
          </div>
          <div className="form-field">
            <label htmlFor="checkout-email" className="field-label">
              Email (tùy chọn)
            </label>
            <input
              id="checkout-email"
              name="email"
              className="field"
              type="email"
              maxLength={254}
              autoComplete="email"
              disabled={busy}
            />
          </div>
          <div className="form-field">
            <label htmlFor="checkout-address" className="field-label">
              Địa chỉ liên hệ / nhận xe *
            </label>
            <input
              id="checkout-address"
              name="address"
              className="field"
              minLength={5}
              maxLength={500}
              autoComplete="street-address"
              required
              disabled={busy}
            />
          </div>
          <div className="form-field">
            <label htmlFor="checkout-notes" className="field-label">
              Ghi chú
            </label>
            <textarea
              id="checkout-notes"
              name="notes"
              className="field"
              maxLength={2000}
              disabled={busy}
            />
          </div>
          <fieldset className="border-0 p-0 m-0">
            <legend className="field-label mb-3">Phương thức thanh toán</legend>
            <label className="radio-option">
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={method === "cod"}
                onChange={() => setMethod("cod")}
                disabled={busy}
              />
              <span>
                <strong>Thanh toán khi nhận xe / tại showroom</strong>
                <small className="helper block">
                  Nhân viên xác nhận phương án giao và nhận xe.
                </small>
              </span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="paymentMethod"
                value="bank"
                checked={method === "bank"}
                onChange={() => setMethod("bank")}
                disabled={busy || !bankReady}
              />
              <span>
                <strong>Đặt cọc {settings.depositPercent}% qua VietQR</strong>
                <small className="helper block">
                  {bankReady
                    ? "Chuyển khoản với mã đơn làm nội dung."
                    : "Cửa hàng chưa mở phương thức chuyển khoản."}
                </small>
              </span>
            </label>
          </fieldset>
          <div className="summary-row total">
            <span>Tổng giá xe</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="summary-row deposit">
            <span>
              {method === "bank"
                ? "Đặt cọc giữ xe"
                : "Thanh toán trực tuyến lúc này"}
            </span>
            <span>{formatPrice(deposit)}</span>
          </div>
          <label className="check-label my-4">
            <input type="checkbox" name="consent" required disabled={busy} />
            <span>
              Tôi đồng ý với{" "}
              <Link href="/chinh-sach" className="underline">
                điều kiện đặt xe và bảo mật
              </Link>
              .
            </span>
          </label>
          {error && (
            <p className="notice error mb-4" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn w-full"
            disabled={busy || invalid}
          >
            {busy ? "Đang gửi yêu cầu…" : "Xác nhận đặt xe"}
            <ArrowRight size={17} />
          </button>
          <p className="helper mt-3">
            Đơn được ghi nhận để nhân viên liên hệ. Chưa có thanh toán nào được
            thực hiện khi nhấn nút đặt xe.
          </p>
        </form>
      </section>
    </div>
  );
}
