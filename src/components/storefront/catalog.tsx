"use client";
import { useState } from "react";
import { Search, SlidersHorizontal, X, Bike } from "lucide-react";
import type { Product } from "@/types";
import { ProductCard } from "./product-card";
import {
  filterProducts,
  emptyFilters,
  type CatalogFilters,
} from "@/lib/catalog";
export function Catalog({
  products,
  initial,
  sales,
}: {
  products: Product[];
  initial: Partial<CatalogFilters>;
  sales: Record<string, number>;
}) {
  const [filters, setFilters] = useState<CatalogFilters>({
    ...emptyFilters,
    ...initial,
  });
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const brands = Array.from(new Set(products.map((p) => p.brand)));
  const result = filterProducts(products, filters, sales);
  const totalPages = Math.ceil(result.length / 12);
  const shown = result.slice((page - 1) * 12, page * 12);
  function change(key: keyof CatalogFilters, value: string) {
    const next = { ...filters, [key]: value };
    if (key === "type") {
      if (value === "electric") next.cc = "";
      if (value === "gasoline") {
        next.power = "";
        next.range = "";
      }
    }
    setFilters(next);
    setPage(1);
    const params = new URLSearchParams();
    const names: Record<string, string> = {
      type: "loai",
      brand: "hang",
      search: "tim",
      budget: "gia",
      cc: "cc",
      power: "kw",
      range: "km",
      seat: "yen",
      brake: "phanh",
      sort: "sap-xep",
    };
    Object.entries(next).forEach(([k, v]) => {
      if (v && !(k === "sort" && v === "featured")) params.set(names[k], v);
    });
    window.history.replaceState(
      null,
      "",
      "/xe" + (params.size ? "?" + params.toString() : ""),
    );
  }
  function reset() {
    setFilters({ ...emptyFilters });
    setPage(1);
    window.history.replaceState(null, "", "/xe");
  }
  const activeCount = Object.entries(filters).filter(
    ([k, v]) => k !== "sort" && v,
  ).length;
  return (
    <div className="catalog-layout">
      <aside
        className={"catalog-filter " + (open ? "open" : "")}
        aria-label="Bộ lọc xe"
      >
        <div className="filter-title">
          <span>Bộ lọc tìm xe</span>
          <button type="button" className="text-link" onClick={reset}>
            Xóa lọc
          </button>
        </div>
        <div className="filter-group">
          <fieldset>
            <legend>Loại xe</legend>
            {[
              ["", "Tất cả xe"],
              ["gasoline", "Xe máy xăng"],
              ["electric", "Xe máy điện"],
              ["accessory", "Phụ kiện"],
            ].map(([v, label]) => (
              <label className="check-label" key={label}>
                <input
                  type="radio"
                  name="type"
                  checked={filters.type === v}
                  onChange={() => change("type", v)}
                />
                {label}
              </label>
            ))}
          </fieldset>
        </div>
        <div className="filter-group">
          <label htmlFor="brand">Thương hiệu</label>
          <select
            className="field"
            id="brand"
            value={filters.brand}
            onChange={(e) => change("brand", e.target.value)}
          >
            <option value="">Tất cả thương hiệu</option>
            {brands.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="budget">Khoảng giá</label>
          <select
            className="field"
            id="budget"
            value={filters.budget}
            onChange={(e) => change("budget", e.target.value)}
          >
            <option value="">Tất cả mức giá</option>
            <option value="under30">Dưới 30 triệu</option>
            <option value="30to60">30 – 60 triệu</option>
            <option value="60to100">60 – 100 triệu</option>
            <option value="over100">Trên 100 triệu</option>
          </select>
        </div>
        {filters.type !== "electric" && (
          <div className="filter-group">
            <label htmlFor="cc">Dung tích xi-lanh</label>
            <select
              className="field"
              id="cc"
              value={filters.cc}
              onChange={(e) => change("cc", e.target.value)}
            >
              <option value="">Tất cả dung tích</option>
              <option value="under125">Dưới 125 cc</option>
              <option value="125to175">125 – 175 cc</option>
              <option value="over175">Trên 175 cc</option>
            </select>
          </div>
        )}
        {filters.type !== "gasoline" && (
          <>
            <div className="filter-group">
              <label htmlFor="power">Công suất động cơ điện</label>
              <select
                className="field"
                id="power"
                value={filters.power}
                onChange={(e) => change("power", e.target.value)}
              >
                <option value="">Tất cả công suất</option>
                <option value="2">Từ 2 kW</option>
                <option value="4">Từ 4 kW</option>
                <option value="6">Từ 6 kW</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="range">Quãng đường hãng công bố</label>
              <select
                className="field"
                id="range"
                value={filters.range}
                onChange={(e) => change("range", e.target.value)}
              >
                <option value="">Tất cả quãng đường</option>
                <option value="100">Từ 100 km</option>
                <option value="200">Từ 200 km</option>
                <option value="250">Từ 250 km</option>
              </select>
              <p className="helper">
                Theo điều kiện thử của hãng; một số xe cần pin phụ. Xem chi tiết
                trên trang xe.
              </p>
            </div>
          </>
        )}
        <div className="filter-group">
          <label htmlFor="seat">Chiều cao yên tối đa</label>
          <select
            className="field"
            id="seat"
            value={filters.seat}
            onChange={(e) => change("seat", e.target.value)}
          >
            <option value="">Không giới hạn</option>
            <option value="760">760 mm</option>
            <option value="780">780 mm</option>
            <option value="800">800 mm</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="brake">Hệ thống phanh</label>
          <select
            className="field"
            id="brake"
            value={filters.brake}
            onChange={(e) => change("brake", e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="ABS">ABS</option>
            <option value="CBS">CBS</option>
          </select>
          <p className="helper">Chỉ lọc xe có thông tin phanh được xác nhận.</p>
        </div>
      </aside>
      <div className="catalog-results">
        <div className="search-field">
          <Search size={19} />
          <label className="sr-only" htmlFor="catalog-search">
            Tìm tên xe hoặc thương hiệu
          </label>
          <input
            className="field"
            id="catalog-search"
            placeholder="Tìm tên xe, thương hiệu…"
            value={filters.search}
            onChange={(e) => change("search", e.target.value)}
          />
        </div>
        <div className="catalog-toolbar">
          <span aria-live="polite">
            Tìm thấy <strong>{result.length}</strong> sản phẩm
          </span>
          <button
            type="button"
            className="btn btn-outline mobile-filter-button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <SlidersHorizontal size={17} />
            Bộ lọc{activeCount > 0 ? " (" + activeCount + ")" : ""}
          </button>
          <label className="sr-only" htmlFor="sort">
            Sắp xếp sản phẩm
          </label>
          <select
            className="field"
            id="sort"
            value={filters.sort}
            onChange={(e) => change("sort", e.target.value)}
          >
            <option value="featured">Nổi bật</option>
            <option value="priceAsc">Giá tăng dần</option>
            <option value="priceDesc">Giá giảm dần</option>
            <option value="newest">Mới nhất</option>
            <option value="best">Bán chạy nhất</option>
          </select>
        </div>
        {activeCount > 0 && (
          <div className="active-filters">
            {Object.entries(filters)
              .filter(([k, v]) => k !== "sort" && v)
              .map(([k, v]) => (
                <button
                  key={k}
                  className="chip"
                  type="button"
                  onClick={() => change(k as keyof CatalogFilters, "")}
                  aria-label={"Bỏ bộ lọc " + k}
                >
                  <span>
                    {k === "type"
                      ? v === "electric"
                        ? "Xe điện"
                        : v === "gasoline"
                          ? "Xe xăng"
                          : "Phụ kiện"
                      : v}
                  </span>
                  <X size={12} />
                </button>
              ))}
            <button className="chip" onClick={reset}>
              Xóa tất cả
            </button>
          </div>
        )}
        {shown.length > 0 ? (
          <div className="product-grid">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Bike size={45} />
            <h2>Chưa tìm thấy mẫu xe phù hợp</h2>
            <p>Thử bỏ bớt một bộ lọc hoặc tìm bằng tên thương hiệu.</p>
            <button className="btn btn-outline" onClick={reset}>
              Xóa bộ lọc
            </button>
          </div>
        )}
        {totalPages > 1 && (
          <nav className="pagination" aria-label="Phân trang danh mục">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => {
                  setPage(i + 1);
                  document
                    .getElementById("catalog-search")
                    ?.scrollIntoView({ block: "center" });
                }}
                aria-current={page === i + 1 ? "page" : undefined}
                aria-label={"Trang " + (i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </nav>
        )}
        <p className="reference-note">
          Giá và thông số tham khảo từ nhà sản xuất. Tồn kho và giá cuối cùng
          được nhân viên xác nhận khi đặt xe.
        </p>
      </div>
    </div>
  );
}
