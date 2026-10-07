"use client";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import type { Banner, Showroom, SiteSettings } from "@/types";
import { Field, ImagePreview, ImageUpload } from "./form-controls";
import { ReviewsEditor } from "./reviews-editor";

export function SettingsEditor({
  settings,
  pending,
  onSave,
}: {
  settings: SiteSettings;
  pending: boolean;
  onSave: (settings: SiteSettings) => Promise<void>;
}) {
  const [draft, setDraft] = useState(() => structuredClone(settings));
  function change<K extends keyof SiteSettings>(
    key: K,
    value: SiteSettings[K],
  ) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }
  function bannerChange(id: string, values: Partial<Banner>) {
    setDraft((previous) => ({
      ...previous,
      heroBanners: previous.heroBanners.map((banner) =>
        banner.id === id ? { ...banner, ...values } : banner,
      ),
    }));
  }
  function showroomChange(id: string, values: Partial<Showroom>) {
    setDraft((previous) => ({
      ...previous,
      showrooms: previous.showrooms.map((showroom) =>
        showroom.id === id ? { ...showroom, ...values } : showroom,
      ),
    }));
  }
  return (
    <form
      className="adm-editor"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(draft);
      }}
    >
      <div className="adm-section-title">
        <div>
          <h2>Cấu hình website</h2>
          <p>Thông tin thương hiệu, nội dung và điều kiện đặt xe.</p>
        </div>
        <button className="adm-button" type="submit" disabled={pending}>
          <Save size={17} />
          {pending ? "Đang lưu…" : "Lưu cấu hình"}
        </button>
      </div>
      <section className="adm-panel">
        <h3>Thương hiệu & liên hệ</h3>
        <div className="adm-form-grid">
          <Field label="Tên website">
            <input
              required
              maxLength={120}
              value={draft.siteName}
              onChange={(event) => change("siteName", event.target.value)}
            />
          </Field>
          <Field
            label="Màu chủ đạo"
            hint="Màu này được áp dụng ở các điểm nhấn thương hiệu."
          >
            <div className="adm-color">
              <input
                aria-label="Chọn màu chủ đạo"
                type="color"
                value={draft.primaryColor}
                onChange={(event) => change("primaryColor", event.target.value)}
              />
              <input
                aria-label="Mã màu chủ đạo"
                required
                pattern="#[0-9a-fA-F]{6}"
                value={draft.primaryColor}
                onChange={(event) => change("primaryColor", event.target.value)}
              />
            </div>
          </Field>
          <Field label="Số điện thoại">
            <input
              type="tel"
              maxLength={30}
              value={draft.contactPhone}
              onChange={(event) => change("contactPhone", event.target.value)}
            />
          </Field>
          <Field label="Email liên hệ">
            <input
              type="email"
              maxLength={200}
              value={draft.contactEmail}
              onChange={(event) => change("contactEmail", event.target.value)}
            />
          </Field>
          <Field label="Địa chỉ">
            <textarea
              rows={2}
              maxLength={500}
              value={draft.address}
              onChange={(event) => change("address", event.target.value)}
            />
          </Field>
          <Field label="Thanh thông báo đầu trang">
            <textarea
              rows={2}
              maxLength={500}
              value={draft.topBar}
              onChange={(event) => change("topBar", event.target.value)}
            />
          </Field>
        </div>
        <div className="adm-form-grid">
          {(
            [
              { key: "logoUrl", label: "Logo" },
              { key: "faviconUrl", label: "Favicon" },
            ] as const
          ).map((item) => (
            <div key={item.key} className="adm-media-setting">
              <Field label={`URL ${item.label}`}>
                <input
                  value={draft[item.key]}
                  maxLength={2000}
                  onChange={(event) => change(item.key, event.target.value)}
                />
              </Field>
              <div className="adm-image-edit">
                <ImagePreview src={draft[item.key]} alt={item.label} />
                <ImageUpload
                  label={`Tải ${item.label}`}
                  onUpload={(url) => change(item.key, url)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="adm-panel">
        <h3>Các khối trang chủ</h3>
        <div className="adm-check-row">
          {(
            [
              { key: "featured", label: "Xe nổi bật" },
              { key: "electric", label: "Xe điện" },
              { key: "news", label: "Tin tức" },
              { key: "showrooms", label: "Showroom" },
              { key: "reviews", label: "Đánh giá khách hàng" },
            ] as const
          ).map((item) => (
            <label key={item.key}>
              <input
                type="checkbox"
                checked={draft.blocks[item.key]}
                onChange={(event) =>
                  change("blocks", {
                    ...draft.blocks,
                    [item.key]: event.target.checked,
                  })
                }
              />
              {item.label}
            </label>
          ))}
        </div>
        <Field label="Nội dung pop-up ưu đãi" hint="Để trống để tắt pop-up.">
          <textarea
            maxLength={2000}
            rows={3}
            value={draft.popup}
            onChange={(event) => change("popup", event.target.value)}
          />
        </Field>
      </section>
      <section className="adm-panel">
        <div className="adm-section-title">
          <div>
            <h3>Banner trang chủ</h3>
            <p>Thứ tự bên dưới cũng là thứ tự hiển thị.</p>
          </div>
          <button
            type="button"
            className="adm-button adm-secondary"
            onClick={() =>
              change("heroBanners", [
                ...draft.heroBanners,
                {
                  id: crypto.randomUUID(),
                  title: "",
                  subtitle: "",
                  image: "",
                  href: "/xe",
                  label: "Khám phá xe",
                },
              ])
            }
          >
            <Plus size={17} />
            Thêm banner
          </button>
        </div>
        {draft.heroBanners.length === 0 && (
          <p className="adm-empty">Chưa có banner.</p>
        )}
        {draft.heroBanners.map((banner, index) => (
          <div key={banner.id} className="adm-variant">
            <div className="adm-section-title">
              <h4>Banner {index + 1}</h4>
              <div className="adm-actions">
                <button
                  type="button"
                  className="adm-button adm-secondary"
                  disabled={index === 0}
                  onClick={() => {
                    const next = [...draft.heroBanners];
                    [next[index - 1], next[index]] = [
                      next[index],
                      next[index - 1],
                    ];
                    change("heroBanners", next);
                  }}
                >
                  Lên
                </button>
                <button
                  type="button"
                  className="adm-button adm-secondary"
                  disabled={index === draft.heroBanners.length - 1}
                  onClick={() => {
                    const next = [...draft.heroBanners];
                    [next[index + 1], next[index]] = [
                      next[index],
                      next[index + 1],
                    ];
                    change("heroBanners", next);
                  }}
                >
                  Xuống
                </button>
                <button
                  type="button"
                  className="adm-button adm-danger"
                  aria-label={`Xóa banner ${index + 1}`}
                  onClick={() =>
                    change(
                      "heroBanners",
                      draft.heroBanners.filter((item) => item.id !== banner.id),
                    )
                  }
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
            <div className="adm-form-grid">
              <Field label="Tiêu đề">
                <input
                  required
                  maxLength={180}
                  value={banner.title}
                  onChange={(event) =>
                    bannerChange(banner.id, { title: event.target.value })
                  }
                />
              </Field>
              <Field label="Dòng mô tả">
                <input
                  maxLength={500}
                  value={banner.subtitle}
                  onChange={(event) =>
                    bannerChange(banner.id, { subtitle: event.target.value })
                  }
                />
              </Field>
              <Field label="Nhãn banner">
                <input
                  maxLength={80}
                  value={banner.label}
                  onChange={(event) =>
                    bannerChange(banner.id, { label: event.target.value })
                  }
                />
              </Field>
              <Field
                label="Liên kết nút"
                hint="Đường dẫn nội bộ bắt đầu bằng /, ví dụ /xe."
              >
                <input
                  value={banner.href}
                  maxLength={500}
                  onChange={(event) =>
                    bannerChange(banner.id, { href: event.target.value })
                  }
                />
              </Field>
              <Field label="URL ảnh">
                <input
                  value={banner.image}
                  maxLength={2000}
                  onChange={(event) =>
                    bannerChange(banner.id, { image: event.target.value })
                  }
                />
              </Field>
              <div className="adm-image-edit">
                <ImagePreview
                  src={banner.image}
                  alt={banner.title || `Banner ${index + 1}`}
                />
                <ImageUpload
                  label={`Tải ảnh banner ${index + 1}`}
                  onUpload={(url) => bannerChange(banner.id, { image: url })}
                />
              </div>
            </div>
          </div>
        ))}
      </section>
      <section className="adm-panel">
        <div className="adm-section-title">
          <h3>Hệ thống showroom</h3>
          <button
            type="button"
            className="adm-button adm-secondary"
            onClick={() =>
              change("showrooms", [
                ...draft.showrooms,
                {
                  id: crypto.randomUUID(),
                  name: "",
                  address: "",
                  hours: "",
                  mapUrl: "",
                },
              ])
            }
          >
            <Plus size={17} />
            Thêm showroom
          </button>
        </div>
        {draft.showrooms.length === 0 && (
          <p className="adm-empty">
            Chưa có showroom. Thêm địa điểm thật trước khi nhận lịch lái thử.
          </p>
        )}
        {draft.showrooms.map((showroom, index) => (
          <div key={showroom.id} className="adm-variant">
            <div className="adm-section-title">
              <h4>Showroom {index + 1}</h4>
              <button
                type="button"
                className="adm-button adm-danger"
                aria-label={`Xóa showroom ${showroom.name || index + 1}`}
                onClick={() =>
                  change(
                    "showrooms",
                    draft.showrooms.filter((item) => item.id !== showroom.id),
                  )
                }
              >
                <Trash2 size={17} />
                Xóa
              </button>
            </div>
            <div className="adm-form-grid">
              <Field label="Tên showroom">
                <input
                  required
                  maxLength={160}
                  value={showroom.name}
                  onChange={(event) =>
                    showroomChange(showroom.id, { name: event.target.value })
                  }
                />
              </Field>
              <Field label="Địa chỉ showroom">
                <input
                  required
                  maxLength={500}
                  value={showroom.address}
                  onChange={(event) =>
                    showroomChange(showroom.id, { address: event.target.value })
                  }
                />
              </Field>
              <Field label="Giờ mở cửa">
                <input
                  maxLength={120}
                  value={showroom.hours}
                  onChange={(event) =>
                    showroomChange(showroom.id, { hours: event.target.value })
                  }
                />
              </Field>
              <Field label="Liên kết bản đồ">
                <input
                  type="url"
                  maxLength={2000}
                  value={showroom.mapUrl}
                  onChange={(event) =>
                    showroomChange(showroom.id, { mapUrl: event.target.value })
                  }
                />
              </Field>
            </div>
          </div>
        ))}
      </section>
      <section className="adm-panel">
        <ReviewsEditor
          reviews={draft.reviews ?? []}
          onChange={(reviews) => change("reviews", reviews)}
        />
      </section>
      <section className="adm-panel">
        <h3>Đặt cọc & dự toán trả góp</h3>
        <div className="adm-form-grid">
          <Field label="Tỷ lệ đặt cọc (%)">
            <input
              required
              type="number"
              min={1}
              max={100}
              step="any"
              value={draft.depositPercent}
              onChange={(event) =>
                change("depositPercent", Number(event.target.value))
              }
            />
          </Field>
          <Field label="Lãi suất dự kiến (% / năm)">
            <input
              required
              type="number"
              min={0}
              max={100}
              step="any"
              value={draft.annualInterestRate}
              onChange={(event) =>
                change("annualInterestRate", Number(event.target.value))
              }
            />
          </Field>
          <Field
            label="Mã ngân hàng (BIN)"
            hint="Mã ngân hàng 6 chữ số để tạo VietQR."
          >
            <input
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={draft.bankBin}
              onChange={(event) => change("bankBin", event.target.value)}
            />
          </Field>
          <Field label="Số tài khoản">
            <input
              inputMode="numeric"
              maxLength={40}
              value={draft.bankAccount}
              onChange={(event) => change("bankAccount", event.target.value)}
            />
          </Field>
          <Field label="Tên chủ tài khoản">
            <input
              maxLength={120}
              value={draft.bankName}
              onChange={(event) => change("bankName", event.target.value)}
            />
          </Field>
        </div>
        <p className="adm-hint">
          Điền tài khoản nhận tiền chính thức của cửa hàng để sử dụng thanh toán
          chuyển khoản.
        </p>
      </section>
      <div className="adm-editor-header">
        <span className="adm-hint">Thay đổi được áp dụng sau khi lưu.</span>
        <button type="submit" disabled={pending} className="adm-button">
          <Save size={17} />
          {pending ? "Đang lưu…" : "Lưu cấu hình"}
        </button>
      </div>
    </form>
  );
}
