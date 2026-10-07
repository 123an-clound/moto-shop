"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { slugify } from "@/lib/utils";
import type { Product, ProductVariant, Specification } from "@/types";
import { Field, ImagePreview, ImageUpload } from "./form-controls";

export function newProduct(): Product {
  return {
    id: crypto.randomUUID(),
    name: "",
    slug: "",
    brand: "",
    type: "gasoline",
    price: 0,
    salePrice: null,
    description: "",
    featured: false,
    inStock: true,
    published: false,
    createdAt: new Date().toISOString(),
    engineCc: null,
    motorKw: null,
    batteryKwh: null,
    rangeKm: null,
    seatHeight: null,
    brake: "",
    variants: [
      {
        id: crypto.randomUUID(),
        colorName: "",
        colorHex: "#171717",
        images: [],
        stock: 0,
      },
    ],
    specs: [],
    sourceUrl: "",
    sourceDate: "",
    priceNote: "",
  };
}

export function ProductEditor({
  product,
  pending,
  onSave,
  onCancel,
}: {
  product: Product;
  pending: boolean;
  onSave: (product: Product) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(() => structuredClone(product));
  function change<K extends keyof Product>(key: K, value: Product[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }
  function variantChange(id: string, values: Partial<ProductVariant>) {
    setDraft((previous) => ({
      ...previous,
      variants: previous.variants.map((variant) =>
        variant.id === id ? { ...variant, ...values } : variant,
      ),
    }));
  }
  function specChange(index: number, values: Partial<Specification>) {
    change(
      "specs",
      draft.specs.map((spec, position) =>
        position === index ? { ...spec, ...values } : spec,
      ),
    );
  }
  const numericFilters: {
    key: "engineCc" | "motorKw" | "batteryKwh" | "rangeKm" | "seatHeight";
    label: string;
  }[] = [
    { key: "engineCc", label: "Dung tích xi-lanh (cc)" },
    { key: "motorKw", label: "Công suất motor (kW)" },
    { key: "batteryKwh", label: "Dung lượng pin (kWh)" },
    { key: "rangeKm", label: "Quãng đường công bố (km)" },
    { key: "seatHeight", label: "Chiều cao yên (mm)" },
  ];
  return (
    <form
      className="adm-editor"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(draft);
      }}
    >
      <div className="adm-editor-header">
        <button
          type="button"
          className="adm-button adm-secondary"
          onClick={onCancel}
          disabled={pending}
        >
          <ArrowLeft size={17} />
          Danh sách xe
        </button>
        <button className="adm-button" type="submit" disabled={pending}>
          <Save size={17} />
          {pending ? "Đang lưu…" : "Lưu sản phẩm"}
        </button>
      </div>
      <section className="adm-panel">
        <h2>{product.name ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm"}</h2>
        <div className="adm-form-grid">
          <Field label="Tên sản phẩm">
            <input
              required
              maxLength={160}
              value={draft.name}
              onChange={(event) => {
                const name = event.target.value;
                setDraft((previous) => ({
                  ...previous,
                  name,
                  slug:
                    !product.name &&
                    (previous.slug === slugify(previous.name) || !previous.slug)
                      ? slugify(name)
                      : previous.slug,
                }));
              }}
            />
          </Field>
          <Field label="Đường dẫn sản phẩm (slug)">
            <input
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={150}
              value={draft.slug}
              onChange={(event) => change("slug", event.target.value)}
            />
          </Field>
          <Field label="Thương hiệu">
            <input
              required
              maxLength={80}
              value={draft.brand}
              onChange={(event) => change("brand", event.target.value)}
            />
          </Field>
          <Field label="Loại sản phẩm">
            <select
              value={draft.type}
              onChange={(event) =>
                change("type", event.target.value as Product["type"])
              }
            >
              <option value="gasoline">Xe xăng</option>
              <option value="electric">Xe điện</option>
              <option value="accessory">Phụ kiện</option>
            </select>
          </Field>
          <Field label="Giá niêm yết (đ)">
            <input
              type="number"
              required
              min={1}
              step={1}
              value={draft.price}
              onChange={(event) => change("price", Number(event.target.value))}
            />
          </Field>
          <Field
            label="Giá khuyến mãi (đ)"
            hint="Để trống nếu không có khuyến mãi."
          >
            <input
              type="number"
              min={1}
              max={draft.price || undefined}
              step={1}
              value={draft.salePrice ?? ""}
              onChange={(event) =>
                change(
                  "salePrice",
                  event.target.value === "" ? null : Number(event.target.value),
                )
              }
            />
          </Field>
          <Field label="Mô tả">
            <textarea
              rows={5}
              maxLength={10000}
              value={draft.description}
              onChange={(event) => change("description", event.target.value)}
            />
          </Field>
          <Field label="Thông tin giá / điều kiện áp dụng">
            <textarea
              rows={5}
              maxLength={1000}
              value={draft.priceNote}
              onChange={(event) => change("priceNote", event.target.value)}
            />
          </Field>
        </div>
        <div className="adm-check-row">
          {(
            [
              { key: "published", label: "Hiển thị trên website" },
              { key: "featured", label: "Xe nổi bật" },
              { key: "inStock", label: "Đang nhận đặt xe" },
            ] as const
          ).map((item) => (
            <label key={item.key}>
              <input
                type="checkbox"
                checked={draft[item.key]}
                onChange={(event) => change(item.key, event.target.checked)}
              />
              {item.label}
            </label>
          ))}
        </div>
      </section>
      <section className="adm-panel">
        <div className="adm-section-title">
          <div>
            <h2>Màu sắc & hình ảnh</h2>
            <p>Mỗi màu sử dụng đúng bộ ảnh tương ứng.</p>
          </div>
          <button
            className="adm-button adm-secondary"
            type="button"
            onClick={() =>
              change("variants", [
                ...draft.variants,
                {
                  id: crypto.randomUUID(),
                  colorName: "",
                  colorHex: "#171717",
                  images: [],
                  stock: 0,
                },
              ])
            }
          >
            <Plus size={17} />
            Thêm màu
          </button>
        </div>
        {draft.variants.map((variant, index) => (
          <div className="adm-variant" key={variant.id}>
            <div className="adm-section-title">
              <h3>Màu {index + 1}</h3>
              <button
                className="adm-button adm-danger"
                type="button"
                aria-label={`Xóa màu ${variant.colorName || index + 1}`}
                disabled={draft.variants.length <= 1}
                onClick={() =>
                  change(
                    "variants",
                    draft.variants.filter((item) => item.id !== variant.id),
                  )
                }
              >
                <Trash2 size={17} />
                Xóa màu
              </button>
            </div>
            <div className="adm-form-grid adm-three">
              <Field label="Tên màu">
                <input
                  required
                  value={variant.colorName}
                  maxLength={80}
                  onChange={(event) =>
                    variantChange(variant.id, { colorName: event.target.value })
                  }
                />
              </Field>
              <Field label="Mã màu">
                <div className="adm-color">
                  <input
                    type="color"
                    aria-label={`Chọn mã màu ${variant.colorName || index + 1}`}
                    value={variant.colorHex}
                    onChange={(event) =>
                      variantChange(variant.id, {
                        colorHex: event.target.value,
                      })
                    }
                  />
                  <input
                    aria-label={`Mã HEX màu ${index + 1}`}
                    required
                    pattern="#[0-9a-fA-F]{6}"
                    value={variant.colorHex}
                    onChange={(event) =>
                      variantChange(variant.id, {
                        colorHex: event.target.value,
                      })
                    }
                  />
                </div>
              </Field>
              <Field label="Số lượng tồn">
                <input
                  required
                  type="number"
                  min={0}
                  step={1}
                  value={variant.stock}
                  onChange={(event) =>
                    variantChange(variant.id, {
                      stock: Number(event.target.value),
                    })
                  }
                />
              </Field>
            </div>
            <div className="adm-image-edit">
              <ImagePreview
                src={variant.images[0] ?? ""}
                alt={`${draft.name} ${variant.colorName}`}
              />
              <Field
                label="URL hình ảnh"
                hint="Mỗi dòng một ảnh. Ảnh đầu tiên là ảnh đại diện."
              >
                <textarea
                  rows={3}
                  value={variant.images.join("\n")}
                  onChange={(event) =>
                    variantChange(variant.id, {
                      images: event.target.value
                        .split("\n")
                        .map((url) => url.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </Field>
              <ImageUpload
                onUpload={(url) =>
                  variantChange(variant.id, {
                    images: [...variant.images, url],
                  })
                }
                label={`Tải ảnh màu ${variant.colorName || index + 1}`}
              />
            </div>
          </div>
        ))}
      </section>
      <section className="adm-panel">
        <h2>Dữ liệu dùng để lọc xe</h2>
        <p>Để trống nếu chưa có thông số xác nhận từ nguồn.</p>
        <div className="adm-form-grid adm-three">
          {numericFilters.map((item) => (
            <Field key={item.key} label={item.label}>
              <input
                type="number"
                min={0}
                step="any"
                value={draft[item.key] ?? ""}
                onChange={(event) =>
                  change(
                    item.key,
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
              />
            </Field>
          ))}
          <Field label="Hệ thống phanh">
            <input
              maxLength={100}
              value={draft.brake}
              onChange={(event) => change("brake", event.target.value)}
            />
          </Field>
        </div>
      </section>
      <section className="adm-panel">
        <div className="adm-section-title">
          <div>
            <h2>Thông số kỹ thuật</h2>
            <p>Thêm thuộc tính và nhóm hiển thị theo từng xe.</p>
          </div>
          <button
            type="button"
            className="adm-button adm-secondary"
            onClick={() =>
              change("specs", [
                ...draft.specs,
                { key: "", value: "", group: "Thông số chung" },
              ])
            }
          >
            <Plus size={17} />
            Thêm thông số
          </button>
        </div>
        {draft.specs.length === 0 && (
          <p className="adm-empty">Chưa có thông số kỹ thuật.</p>
        )}
        {draft.specs.map((spec, index) => (
          <div className="adm-spec" key={index}>
            <Field label={`Nhóm ${index + 1}`}>
              <input
                required
                maxLength={100}
                value={spec.group}
                onChange={(event) =>
                  specChange(index, { group: event.target.value })
                }
              />
            </Field>
            <Field label={`Thuộc tính ${index + 1}`}>
              <input
                required
                maxLength={100}
                value={spec.key}
                onChange={(event) =>
                  specChange(index, { key: event.target.value })
                }
              />
            </Field>
            <Field label={`Giá trị ${index + 1}`}>
              <input
                required
                maxLength={1000}
                value={spec.value}
                onChange={(event) =>
                  specChange(index, { value: event.target.value })
                }
              />
            </Field>
            <button
              type="button"
              className="adm-button adm-danger"
              aria-label={`Xóa thông số ${spec.key || index + 1}`}
              onClick={() =>
                change(
                  "specs",
                  draft.specs.filter((_, position) => position !== index),
                )
              }
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </section>
      <section className="adm-panel">
        <h2>Nguồn dữ liệu</h2>
        <div className="adm-form-grid">
          <Field label="URL nguồn chính hãng">
            <input
              type="url"
              maxLength={2000}
              value={draft.sourceUrl}
              onChange={(event) => change("sourceUrl", event.target.value)}
            />
          </Field>
          <Field label="Ngày cập nhật nguồn">
            <input
              type="date"
              value={draft.sourceDate.slice(0, 10)}
              onChange={(event) => change("sourceDate", event.target.value)}
            />
          </Field>
        </div>
      </section>
      <div className="adm-editor-header">
        <button
          type="button"
          className="adm-button adm-secondary"
          disabled={pending}
          onClick={onCancel}
        >
          Hủy thay đổi
        </button>
        <button className="adm-button" disabled={pending} type="submit">
          <Save size={17} />
          {pending ? "Đang lưu…" : "Lưu sản phẩm"}
        </button>
      </div>
    </form>
  );
}
