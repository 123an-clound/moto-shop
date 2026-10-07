"use client";
import { useState, type FormEvent } from "react";
import { CalendarCheck, CheckCircle2 } from "lucide-react";
import type { Product, SiteSettings } from "@/types";
import { api } from "@/lib/client-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
export function TestDriveForm({
  products,
  settings,
  selectedId,
}: {
  products: Product[];
  settings: SiteSettings;
  selectedId?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [today] = useState(() =>
    new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10),
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    try {
      await api("/api/test-drives", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (success)
    return (
      <div className="notice success" role="status">
        <CheckCircle2 size={24} className="mb-3" />
        <strong>Đã nhận đăng ký của bạn.</strong>
        <p>
          Nhân viên sẽ liên hệ để xác nhận mẫu xe, địa điểm và giờ lái thử. Lịch
          chưa được chốt cho đến khi có xác nhận.
        </p>
      </div>
    );
  return (
    <form onSubmit={submit}>
      <div className="form-field">
        <label className="field-label" htmlFor="ride-product">
          Mẫu xe muốn trải nghiệm *
        </label>
        <select
          id="ride-product"
          name="productId"
          className="field"
          defaultValue={selectedId || products[0]?.id}
          required
        >
          {products
            .filter((p) => p.type !== "accessory")
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
      </div>
      <div className="form-grid">
        <div className="form-field">
          <label className="field-label" htmlFor="ride-name">
            Họ và tên *
          </label>
          <input
            id="ride-name"
            name="fullName"
            className="field"
            autoComplete="name"
            minLength={2}
            maxLength={120}
            required
          />
        </div>
        <div className="form-field">
          <label className="field-label" htmlFor="ride-phone">
            Số điện thoại *
          </label>
          <input
            id="ride-phone"
            name="phone"
            className="field"
            type="tel"
            autoComplete="tel"
            maxLength={25}
            placeholder="09xxxxxxxx"
            required
          />
        </div>
        <div className="form-field full">
          <label className="field-label" htmlFor="ride-email">
            Email (tùy chọn)
          </label>
          <input
            id="ride-email"
            name="email"
            className="field"
            type="email"
            autoComplete="email"
            maxLength={254}
          />
        </div>
        <div className="form-field">
          <label className="field-label" htmlFor="ride-date">
            Ngày mong muốn *
          </label>
          <input
            id="ride-date"
            name="preferredDate"
            className="field"
            type="date"
            min={today}
            required
          />
        </div>
        <div className="form-field">
          <label className="field-label" htmlFor="ride-time">
            Khung giờ *
          </label>
          <select
            id="ride-time"
            name="preferredTime"
            className="field"
            required
          >
            {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="form-field full">
          <label className="field-label" htmlFor="ride-location">
            Showroom *
          </label>
          <select
            id="ride-location"
            name="preferredLocation"
            className="field"
            required
          >
            <option value="">Chọn showroom</option>
            {settings.showrooms.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          {settings.showrooms.length === 0 && (
            <p className="helper">
              Cửa hàng chưa cập nhật showroom. Vui lòng thử lại sau.
            </p>
          )}
        </div>
        <div className="form-field full">
          <label className="field-label" htmlFor="ride-notes">
            Ghi chú
          </label>
          <textarea
            id="ride-notes"
            name="notes"
            className="field"
            maxLength={2000}
            placeholder="Điều bạn muốn được tư vấn…"
          />
        </div>
      </div>
      {error && (
        <p className="notice error mb-4" role="alert">
          {error}
        </p>
      )}
      <p className="helper mb-4">
        Thông tin được dùng để liên hệ xác nhận lịch theo{" "}
        <a href="/chinh-sach#bao-mat" className="underline">
          chính sách bảo mật
        </a>
        .
      </p>
      <Button
        type="submit"
        className="btn w-full"
        disabled={busy || settings.showrooms.length === 0}
      >
        {busy ? (
          "Đang gửi…"
        ) : (
          <>
            <CalendarCheck size={17} />
            Gửi đăng ký lái thử
          </>
        )}
      </Button>
    </form>
  );
}
export function TestDriveDialog({
  product,
  settings,
}: {
  product: Product;
  settings: SiteSettings;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="btn btn-outline">
          <CalendarCheck size={17} />
          Đăng ký lái thử
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[580px] p-6">
        <DialogHeader>
          <DialogTitle>Trải nghiệm {product.brand}</DialogTitle>
          <DialogDescription>
            Chọn thời gian phù hợp. Nhân viên sẽ liên hệ xác nhận lịch.
          </DialogDescription>
        </DialogHeader>
        <TestDriveForm
          products={[product]}
          settings={settings}
          selectedId={product.id}
        />
      </DialogContent>
    </Dialog>
  );
}
