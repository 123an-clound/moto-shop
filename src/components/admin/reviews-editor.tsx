"use client";
import { Plus, Trash2 } from "lucide-react";
import type { Review } from "@/types";
import { Field } from "./form-controls";

export function ReviewsEditor({
  reviews,
  onChange,
}: {
  reviews: Review[];
  onChange: (reviews: Review[]) => void;
}) {
  function change(id: string, values: Partial<Review>) {
    onChange(reviews.map((r) => (r.id === id ? { ...r, ...values } : r)));
  }
  return (
    <>
      <div className="adm-section-title">
        <div>
          <h3>Đánh giá khách hàng</h3>
          <p>
            Chỉ đăng phản hồi thật khi khách đồng ý công khai tên và nội dung.
          </p>
        </div>
        <button
          className="adm-button adm-secondary"
          type="button"
          disabled={reviews.length >= 20}
          onClick={() =>
            onChange([
              ...reviews,
              {
                id: crypto.randomUUID(),
                name: "",
                model: "",
                quote: "",
                rating: 5,
              },
            ])
          }
        >
          <Plus size={17} />
          Thêm đánh giá
        </button>
      </div>
      {!reviews.length && (
        <p className="adm-empty">
          Chưa có đánh giá. Khối này ẩn cho đến khi có nội dung và được bật ở
          phần Các khối trang chủ.
        </p>
      )}
      {reviews.map((review, index) => (
        <div className="adm-variant" key={review.id}>
          <div className="adm-section-title">
            <h4>Đánh giá {index + 1}</h4>
            <button
              type="button"
              className="adm-button adm-danger"
              aria-label={"Xóa đánh giá " + (index + 1)}
              onClick={() =>
                onChange(reviews.filter((r) => r.id !== review.id))
              }
            >
              <Trash2 size={17} />
            </button>
          </div>
          <div className="adm-form-grid">
            <Field label={"Tên khách " + (index + 1)}>
              <input
                required
                maxLength={120}
                value={review.name}
                onChange={(e) => change(review.id, { name: e.target.value })}
              />
            </Field>
            <Field label={"Mẫu xe đánh giá " + (index + 1)}>
              <input
                maxLength={160}
                value={review.model}
                onChange={(e) => change(review.id, { model: e.target.value })}
              />
            </Field>
            <Field label={"Số sao " + (index + 1)}>
              <input
                type="number"
                required
                min={1}
                max={5}
                step={1}
                value={review.rating}
                onChange={(e) =>
                  change(review.id, { rating: Number(e.target.value) })
                }
              />
            </Field>
            <Field label={"Nội dung đánh giá " + (index + 1)}>
              <textarea
                required
                maxLength={1200}
                rows={4}
                value={review.quote}
                onChange={(e) => change(review.id, { quote: e.target.value })}
              />
            </Field>
          </div>
        </div>
      ))}
    </>
  );
}
