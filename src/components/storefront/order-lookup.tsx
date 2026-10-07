"use client";
import { useState, type FormEvent } from "react";
import { Search, PackageCheck } from "lucide-react";
import type { Order } from "@/types";
import { api } from "@/lib/client-api";
import { formatPrice } from "@/lib/utils";
type Lookup = Pick<
  Order,
  "code" | "status" | "paymentStatus" | "total" | "deposit" | "createdAt"
> & {
  items: Pick<
    Order["items"][number],
    "name" | "color" | "quantity" | "unitPrice"
  >[];
};
const statusLabel = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};
export function OrderLookup({ initialCode = "" }: { initialCode?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Lookup | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOrder(null);
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const result = await api<{ order: Lookup }>("/api/orders/lookup", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setOrder(result.order);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form className="panel" onSubmit={submit}>
        <div className="form-field">
          <label className="field-label" htmlFor="lookup-code">
            Mã đơn hàng *
          </label>
          <input
            className="field"
            id="lookup-code"
            name="code"
            defaultValue={initialCode}
            placeholder="MS…"
            autoCapitalize="characters"
            minLength={8}
            maxLength={40}
            required
          />
        </div>
        <div className="form-field">
          <label className="field-label" htmlFor="lookup-phone">
            Số điện thoại đã đặt xe *
          </label>
          <input
            className="field"
            id="lookup-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            maxLength={25}
          />
        </div>
        <button className="btn w-full" type="submit" disabled={busy}>
          <Search size={17} />
          {busy ? "Đang tra cứu…" : "Tra cứu đơn hàng"}
        </button>
        <p className="helper mt-4">
          Cần khớp cả mã đơn và số điện thoại để bảo vệ thông tin đặt xe.
        </p>
      </form>
      {error && (
        <p className="notice error mt-5" role="alert">
          {error}
        </p>
      )}
      {order && (
        <section className="panel mt-6" aria-live="polite">
          <h2>
            <PackageCheck size={23} className="inline mr-2" />
            Đơn {order.code}
          </h2>
          <div className="summary-row">
            <span>Trạng thái đơn</span>
            <strong>{statusLabel[order.status]}</strong>
          </div>
          <div className="summary-row">
            <span>Thanh toán</span>
            <strong>
              {order.paymentStatus === "paid"
                ? "Đã ghi nhận thanh toán"
                : "Chưa thanh toán"}
            </strong>
          </div>
          <div className="summary-row">
            <span>Ngày đặt</span>
            <span>
              {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                timeZone: "Asia/Ho_Chi_Minh",
              })}
            </span>
          </div>
          {order.items.map((item, i) => (
            <div className="summary-row" key={i}>
              <span>
                {item.name}
                <small className="helper block">
                  {item.color} · Số lượng {item.quantity}
                </small>
              </span>
              <strong>{formatPrice(item.unitPrice * item.quantity)}</strong>
            </div>
          ))}
          <div className="summary-row total">
            <span>Tổng giá xe</span>
            <span>{formatPrice(order.total)}</span>
          </div>
          <div className="summary-row">
            <span>Khoản cọc của đơn</span>
            <span>{formatPrice(order.deposit)}</span>
          </div>
        </section>
      )}
    </>
  );
}
