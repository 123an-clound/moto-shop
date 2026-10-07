"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bike,
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/client-api";
import { formatPrice } from "@/lib/utils";
import type {
  AdminSnapshot,
  Order,
  Product,
  SiteSettings,
  TestDrive,
} from "@/types";
import { ImagePreview } from "./form-controls";
import { newProduct, ProductEditor } from "./product-editor";
import { SettingsEditor } from "./settings-editor";

type Tab = "overview" | "products" | "orders" | "leads" | "settings";
const nav = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "products", label: "Sản phẩm", icon: Bike },
  { id: "orders", label: "Đơn đặt xe", icon: ShoppingBag },
  { id: "leads", label: "Lịch lái thử", icon: CalendarDays },
  { id: "settings", label: "Giao diện & cấu hình", icon: Settings },
] as const;
const orderStatuses: { value: Order["status"]; label: string }[] = [
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "completed", label: "Hoàn tất" },
  { value: "cancelled", label: "Đã hủy" },
];
const leadStatuses: { value: TestDrive["status"]; label: string }[] = [
  ...orderStatuses.slice(0, 2),
  { value: "completed", label: "Đã trải nghiệm" },
  { value: "purchased", label: "Đã mua xe" },
  { value: "cancelled", label: "Đã hủy" },
];
const typeLabel = {
  gasoline: "Xe xăng",
  electric: "Xe điện",
  accessory: "Phụ kiện",
};
function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

async function getSnapshot(
  signal?: AbortSignal,
): Promise<AdminSnapshot | null> {
  const response = await fetch("/api/admin", { cache: "no-store", signal });
  if (response.status === 401) return null;
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error ?? "Không thể tải dữ liệu quản trị.");
  return result as AdminSnapshot;
}

function Overview({ snapshot }: { snapshot: AdminSnapshot }) {
  const [chartMode, setChartMode] = useState<"sales" | "deposits">("sales");
  const paid = snapshot.orders.filter(
    (order) => order.paymentStatus === "paid" && order.status !== "cancelled",
  );
  const deposits = paid.reduce((sum, order) => sum + order.deposit, 0);
  const completed = snapshot.orders.filter(
    (order) => order.status === "completed",
  );
  const chartOrders = chartMode === "sales" ? completed : paid;
  const productsById = new Map(
    snapshot.products.map((product) => [product.id, product]),
  );
  const days = new Map<
    string,
    { date: string; gasoline: number; electric: number; other: number }
  >();
  for (const order of chartOrders) {
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(order.createdAt));
    const row = days.get(date) ?? { date, gasoline: 0, electric: 0, other: 0 };
    const itemTotal = order.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    let allocated = 0;
    const amount = chartMode === "sales" ? order.total : order.deposit;
    if (!itemTotal) row.other += amount;
    order.items.forEach((item, index) => {
      const value =
        index === order.items.length - 1
          ? amount - allocated
          : Math.round((amount * item.unitPrice * item.quantity) / itemTotal);
      allocated += value;
      const type = productsById.get(item.productId)?.type;
      row[type === "gasoline" || type === "electric" ? type : "other"] += value;
    });
    days.set(date, row);
  }
  const chartRows = [...days.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);
  const maximum = Math.max(
    1,
    ...chartRows.map((row) => row.gasoline + row.electric + row.other),
  );
  const stats = [
    {
      label: "Sản phẩm đang hiển thị",
      value: String(
        snapshot.products.filter((product) => product.published).length,
      ),
      detail: `${snapshot.products.length} sản phẩm trong danh mục`,
      icon: Bike,
    },
    {
      label: "Đơn chờ xác nhận",
      value: String(
        snapshot.orders.filter((order) => order.status === "pending").length,
      ),
      detail: `${snapshot.orders.length} đơn đặt xe`,
      icon: ShoppingBag,
    },
    {
      label: "Lịch lái thử mới",
      value: String(
        snapshot.testDrives.filter((lead) => lead.status === "pending").length,
      ),
      detail: `${snapshot.testDrives.length} lịch đã đăng ký`,
      icon: CalendarDays,
    },
    {
      label: "Tiền cọc đã ghi nhận",
      value: formatPrice(deposits),
      detail: `${paid.length} đơn được đánh dấu đã thanh toán`,
      icon: LayoutDashboard,
    },
  ];
  return (
    <>
      <div className="adm-metrics">
        {stats.map((stat) => (
          <section className="adm-metric" key={stat.label}>
            <div>
              <p>{stat.label}</p>
              <stat.icon size={20} aria-hidden="true" />
            </div>
            <strong>{stat.value}</strong>
            <small>{stat.detail}</small>
          </section>
        ))}
      </div>
      <section className="adm-panel">
        <div className="adm-section-title">
          <div>
            <h2>
              {chartMode === "sales"
                ? "Doanh số theo ngày đặt xe"
                : "Tiền cọc theo ngày đặt xe"}
            </h2>
            <p>
              14 ngày có phát sinh gần nhất ·{" "}
              {chartMode === "sales"
                ? "giá trị đơn hoàn tất, phân nhóm theo ngày tạo đơn."
                : "khoản cọc đã thanh toán của đơn chưa hủy, phân nhóm theo ngày tạo đơn."}
            </p>
          </div>
          <label className="adm-field">
            <span>Chỉ số biểu đồ</span>
            <select
              value={chartMode}
              onChange={(event) =>
                setChartMode(event.target.value as "sales" | "deposits")
              }
            >
              <option value="sales">Doanh số đơn hoàn tất</option>
              <option value="deposits">Tiền cọc đã ghi nhận</option>
            </select>
          </label>
          <div className="adm-legend">
            <span>
              <i className="adm-gas" />
              Xe xăng
            </span>
            <span>
              <i className="adm-electric" />
              Xe điện
            </span>
            <span>
              <i className="adm-other" />
              Khác
            </span>
          </div>
        </div>
        {chartRows.length === 0 ? (
          <div className="adm-empty">
            <ShoppingBag size={30} aria-hidden="true" />
            <h3>
              {chartMode === "sales"
                ? "Chưa có đơn hoàn tất"
                : "Chưa có khoản cọc đã ghi nhận"}
            </h3>
            <p>
              {chartMode === "sales"
                ? "Doanh số xuất hiện khi đơn được cập nhật thành hoàn tất."
                : "Dữ liệu xuất hiện khi một đơn được cập nhật thành đã thanh toán."}
            </p>
          </div>
        ) : (
          <>
            <div className="adm-chart" aria-hidden="true">
              {chartRows.map((row) => (
                <div key={row.date} className="adm-chart-row">
                  <span>{dateLabel(row.date)}</span>
                  <div className="adm-chart-track">
                    <i
                      className="adm-gas"
                      style={{ width: `${(row.gasoline / maximum) * 100}%` }}
                    />
                    <i
                      className="adm-electric"
                      style={{ width: `${(row.electric / maximum) * 100}%` }}
                    />
                    <i
                      className="adm-other"
                      style={{ width: `${(row.other / maximum) * 100}%` }}
                    />
                  </div>
                  <strong>
                    {formatPrice(row.gasoline + row.electric + row.other)}
                  </strong>
                </div>
              ))}
            </div>
            <details className="adm-chart-data">
              <summary>Xem dữ liệu dạng bảng</summary>
              <div className="adm-table-wrap">
                <table>
                  <caption className="adm-sr-only">
                    {chartMode === "sales" ? "Doanh số" : "Tiền cọc"} theo ngày
                    đặt xe và loại xe
                  </caption>
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Xe xăng</th>
                      <th>Xe điện</th>
                      <th>Khác</th>
                      <th>Tổng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartRows.map((row) => (
                      <tr key={row.date}>
                        <td>{dateLabel(row.date)}</td>
                        <td>{formatPrice(row.gasoline)}</td>
                        <td>{formatPrice(row.electric)}</td>
                        <td>{formatPrice(row.other)}</td>
                        <td>
                          {formatPrice(row.gasoline + row.electric + row.other)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
            <p className="adm-hint">
              {chartMode === "sales"
                ? "Doanh số là giá trị đơn hoàn tất, chưa phải báo cáo dòng tiền hoặc lợi nhuận."
                : "Khoản cọc được phân bổ theo giá trị từng xe trong đơn."}{" "}
              Thống kê dựa trên trạng thái hiện tại; đối soát thực tế trước khi
              lập báo cáo kế toán.
            </p>
          </>
        )}
      </section>
    </>
  );
}

function OrdersTable({
  orders,
  pending,
  onUpdate,
}: {
  orders: Order[];
  pending: boolean;
  onUpdate: (
    order: Order,
    values: {
      status?: Order["status"];
      paymentStatus?: Order["paymentStatus"];
    },
  ) => void;
}) {
  if (!orders.length)
    return (
      <div className="adm-panel adm-empty">
        <ShoppingBag size={32} />
        <h2>Chưa có đơn đặt xe</h2>
        <p>Đơn mới từ website sẽ được hiển thị tại đây.</p>
      </div>
    );
  return (
    <div className="adm-panel adm-table-wrap">
      <table className="adm-orders">
        <caption className="adm-sr-only">
          Danh sách đơn đặt xe và thanh toán
        </caption>
        <thead>
          <tr>
            <th>Đơn hàng</th>
            <th>Khách hàng</th>
            <th>Giá trị / cọc</th>
            <th>Thanh toán</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <strong>{order.code}</strong>
                <small>{dateLabel(order.createdAt)}</small>
                <details>
                  <summary>
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                    xe · xem chi tiết
                  </summary>
                  <div className="adm-order-details">
                    {order.items.map((item, index) => (
                      <p key={`${item.productId}-${item.variantId}-${index}`}>
                        <strong>{item.name}</strong>
                        <br />
                        {item.color} · SL {item.quantity} ·{" "}
                        {formatPrice(item.unitPrice)}
                      </p>
                    ))}
                    {order.address && <p>Địa chỉ: {order.address}</p>}
                    {order.notes && <p>Ghi chú: {order.notes}</p>}
                  </div>
                </details>
              </td>
              <td>
                <strong>{order.fullName}</strong>
                <a href={`tel:${order.phone}`}>{order.phone}</a>
                {order.email && (
                  <a href={`mailto:${order.email}`}>{order.email}</a>
                )}
              </td>
              <td>
                <strong>{formatPrice(order.total)}</strong>
                <small>Cọc: {formatPrice(order.deposit)}</small>
              </td>
              <td>
                <small>
                  {order.paymentMethod === "bank"
                    ? "Chuyển khoản"
                    : "Thanh toán tại cửa hàng / COD"}
                </small>
                <select
                  aria-label={`Thanh toán đơn ${order.code}`}
                  disabled={pending}
                  value={order.paymentStatus}
                  onChange={(event) =>
                    onUpdate(order, {
                      paymentStatus: event.target
                        .value as Order["paymentStatus"],
                    })
                  }
                >
                  <option value="unpaid">Chưa thanh toán</option>
                  <option value="paid">Đã thanh toán</option>
                </select>
              </td>
              <td>
                <select
                  aria-label={`Trạng thái đơn ${order.code}`}
                  disabled={pending}
                  value={order.status}
                  onChange={(event) =>
                    onUpdate(order, {
                      status: event.target.value as Order["status"],
                    })
                  }
                >
                  {orderStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeadsTable({
  leads,
  pending,
  onUpdate,
}: {
  leads: TestDrive[];
  pending: boolean;
  onUpdate: (lead: TestDrive, status: TestDrive["status"]) => void;
}) {
  if (!leads.length)
    return (
      <div className="adm-panel adm-empty">
        <CalendarDays size={32} />
        <h2>Chưa có lịch lái thử</h2>
        <p>Khách đăng ký trải nghiệm xe sẽ được hiển thị tại đây.</p>
      </div>
    );
  return (
    <div className="adm-panel adm-table-wrap">
      <table>
        <caption className="adm-sr-only">
          Danh sách khách đăng ký lái thử
        </caption>
        <thead>
          <tr>
            <th>Khách hàng</th>
            <th>Xe muốn trải nghiệm</th>
            <th>Lịch hẹn</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>
                <strong>{lead.fullName}</strong>
                <a href={`tel:${lead.phone}`}>{lead.phone}</a>
                {lead.email && (
                  <a href={`mailto:${lead.email}`}>{lead.email}</a>
                )}
              </td>
              <td>
                <strong>{lead.productName}</strong>
                {lead.notes && <small>Ghi chú: {lead.notes}</small>}
              </td>
              <td>
                <strong>
                  {dateLabel(lead.preferredDate)} · {lead.preferredTime}
                </strong>
                <small>{lead.preferredLocation}</small>
              </td>
              <td>
                <select
                  aria-label={`Trạng thái lịch lái thử của ${lead.fullName}`}
                  value={lead.status}
                  disabled={pending}
                  onChange={(event) =>
                    onUpdate(lead, event.target.value as TestDrive["status"])
                  }
                >
                  {leadStatuses.map((status) => (
                    <option value={status.value} key={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminDashboard() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [productType, setProductType] = useState("all");
  const [editor, setEditor] = useState<Product | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void getSnapshot(controller.signal)
      .then((result) => {
        if (result) setSnapshot(result);
        else router.replace("/admin/dang-nhap");
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : "Không thể tải dữ liệu.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [router]);
  const filteredProducts = useMemo(
    () =>
      snapshot?.products.filter(
        (product) =>
          (productType === "all" || product.type === productType) &&
          `${product.name} ${product.brand} ${product.slug}`
            .toLocaleLowerCase("vi")
            .includes(search.toLocaleLowerCase("vi")),
      ) ?? [],
    [snapshot, search, productType],
  );
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const result = await getSnapshot();
      if (result) setSnapshot(result);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể tải dữ liệu.",
      );
    } finally {
      setLoading(false);
    }
  }
  async function mutate(
    url: string,
    method: string,
    body: unknown,
    message: string,
  ): Promise<boolean> {
    setPending(true);
    setError("");
    setSuccess("");
    try {
      await api(url, { method, body: JSON.stringify(body) });
      const result = await getSnapshot();
      if (result) setSnapshot(result);
      setSuccess(message);
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể lưu thay đổi.",
      );
      return false;
    } finally {
      setPending(false);
    }
  }
  async function saveProduct(product: Product) {
    const exists = snapshot?.products.some((item) => item.id === product.id);
    if (
      await mutate(
        "/api/admin/products",
        exists ? "PUT" : "POST",
        product,
        "Đã lưu sản phẩm.",
      )
    )
      setEditor(null);
  }
  async function saveSettings(settings: SiteSettings) {
    await mutate(
      "/api/admin/settings",
      "PUT",
      settings,
      "Đã lưu cấu hình website.",
    );
  }
  async function removeProduct(product: Product) {
    if (
      window.confirm(
        `Xóa sản phẩm “${product.name}”? Sản phẩm sẽ bị gỡ khỏi danh mục.`,
      )
    )
      await mutate(
        "/api/admin/products",
        "DELETE",
        { id: product.id },
        "Đã xóa sản phẩm.",
      );
  }
  async function logout() {
    setPending(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
      router.replace("/admin/dang-nhap");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đăng xuất.");
      setPending(false);
    }
  }
  return (
    <div className="adm-shell">
      <a className="adm-skip" href="#admin-content">
        Đến nội dung quản trị
      </a>
      <aside className="adm-sidebar">
        <Link className="adm-brand" href="/">
          MOTO<span>SHOP</span>
          <small>QUẢN TRỊ CỬA HÀNG</small>
        </Link>
        <nav aria-label="Quản trị">
          {nav.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? "adm-nav active" : "adm-nav"}
              aria-current={tab === item.id ? "page" : undefined}
              disabled={pending}
              onClick={() => {
                if (
                  editor &&
                  !window.confirm(
                    "Rời trang chỉnh sửa? Thay đổi chưa lưu sẽ bị bỏ.",
                  )
                )
                  return;
                setEditor(null);
                setTab(item.id);
                setError("");
                setSuccess("");
              }}
            >
              <item.icon size={20} aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="adm-sidebar-foot">
          <Link className="adm-nav" href="/" target="_blank">
            <ExternalLink size={18} />
            Xem website
          </Link>
          <button
            className="adm-nav"
            disabled={pending}
            onClick={() => void logout()}
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>
      <main id="admin-content" className="adm-main">
        <header className="adm-header">
          <div>
            <p className="adm-eyebrow">MOTOSHOP / QUẢN TRỊ</p>
            <h1>
              {editor
                ? editor.name || "Thêm sản phẩm"
                : nav.find((item) => item.id === tab)?.label}
            </h1>
          </div>
          <div className="adm-actions">
            {snapshot && (
              <span className="adm-mode">
                {snapshot.mode === "supabase" ? "Supabase" : "Dữ liệu cục bộ"}
              </span>
            )}
            <button
              aria-label="Làm mới dữ liệu"
              className="adm-button adm-secondary"
              disabled={loading || pending}
              onClick={() => void refresh()}
            >
              <RefreshCw size={17} />
              <span>Làm mới</span>
            </button>
          </div>
        </header>
        {error && (
          <div className="adm-alert adm-error" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="adm-alert adm-success" role="status">
            {success}
          </div>
        )}
        {loading && !snapshot ? (
          <div className="adm-panel adm-empty" role="status">
            <p>Đang tải dữ liệu quản trị…</p>
          </div>
        ) : !snapshot ? (
          <div className="adm-panel adm-empty">
            <h2>Chưa tải được dữ liệu</h2>
            <button className="adm-button" onClick={() => void refresh()}>
              Thử lại
            </button>
          </div>
        ) : editor ? (
          <ProductEditor
            key={editor.id}
            product={editor}
            onSave={saveProduct}
            onCancel={() => {
              if (window.confirm("Bỏ các thay đổi chưa lưu?")) setEditor(null);
            }}
            pending={pending}
          />
        ) : (
          <>
            {tab === "overview" && <Overview snapshot={snapshot} />}
            {tab === "products" && (
              <>
                <div className="adm-toolbar">
                  <label className="adm-search">
                    <Search size={18} aria-hidden="true" />
                    <input
                      aria-label="Tìm sản phẩm theo tên hoặc thương hiệu"
                      placeholder="Tìm tên xe, thương hiệu…"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Lọc loại sản phẩm"
                    value={productType}
                    onChange={(event) => setProductType(event.target.value)}
                  >
                    <option value="all">Tất cả loại xe</option>
                    <option value="gasoline">Xe xăng</option>
                    <option value="electric">Xe điện</option>
                    <option value="accessory">Phụ kiện</option>
                  </select>
                  <button
                    className="adm-button"
                    disabled={pending}
                    onClick={() => setEditor(newProduct())}
                  >
                    <Plus size={17} />
                    Thêm sản phẩm
                  </button>
                </div>
                <p className="adm-hint">
                  {filteredProducts.length} sản phẩm
                  {search || productType !== "all"
                    ? " phù hợp bộ lọc"
                    : " trong danh mục"}
                </p>
                {!filteredProducts.length ? (
                  <div className="adm-panel adm-empty">
                    <Bike size={32} />
                    <h2>Không có sản phẩm phù hợp</h2>
                    <p>Thử tên xe khác hoặc thêm sản phẩm mới.</p>
                  </div>
                ) : (
                  <div className="adm-panel adm-table-wrap">
                    <table className="adm-products">
                      <caption className="adm-sr-only">
                        Sản phẩm, giá bán và trạng thái hiển thị
                      </caption>
                      <thead>
                        <tr>
                          <th>Sản phẩm</th>
                          <th>Loại</th>
                          <th>Giá bán</th>
                          <th>Hiển thị</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((product) => (
                          <tr key={product.id}>
                            <td>
                              <div className="adm-product-cell">
                                <ImagePreview
                                  src={product.variants[0]?.images[0] ?? ""}
                                  alt={product.name}
                                />
                                <div>
                                  <strong>{product.name}</strong>
                                  <small>
                                    {product.brand} · {product.variants.length}{" "}
                                    màu
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span
                                className={`adm-badge ${product.type === "electric" ? "adm-blue" : ""}`}
                              >
                                {typeLabel[product.type]}
                              </span>
                            </td>
                            <td>
                              <strong>
                                {formatPrice(
                                  product.salePrice ?? product.price,
                                )}
                              </strong>
                              {product.salePrice !== null && (
                                <small>
                                  <s>{formatPrice(product.price)}</s>
                                </small>
                              )}
                            </td>
                            <td>
                              <span className="adm-badge">
                                {product.published
                                  ? "Đang hiển thị"
                                  : "Bản nháp"}
                              </span>
                              <small>
                                {product.inStock
                                  ? "Nhận đặt xe"
                                  : "Tạm hết hàng"}
                              </small>
                            </td>
                            <td>
                              <div className="adm-actions">
                                <button
                                  className="adm-button adm-secondary"
                                  disabled={pending}
                                  aria-label={`Sửa ${product.name}`}
                                  onClick={() =>
                                    setEditor(structuredClone(product))
                                  }
                                >
                                  <Pencil size={17} />
                                  Sửa
                                </button>
                                <button
                                  className="adm-button adm-danger"
                                  aria-label={`Xóa ${product.name}`}
                                  disabled={pending}
                                  onClick={() => void removeProduct(product)}
                                >
                                  <Trash2 size={17} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
            {tab === "orders" && (
              <OrdersTable
                orders={snapshot.orders}
                pending={pending}
                onUpdate={(order, values) =>
                  void mutate(
                    "/api/admin/orders",
                    "PATCH",
                    {
                      id: order.id,
                      status: values.status ?? order.status,
                      paymentStatus:
                        values.paymentStatus ?? order.paymentStatus,
                    },
                    "Đã cập nhật đơn đặt xe.",
                  )
                }
              />
            )}
            {tab === "leads" && (
              <LeadsTable
                leads={snapshot.testDrives}
                pending={pending}
                onUpdate={(lead, status) =>
                  void mutate(
                    "/api/admin/test-drives",
                    "PATCH",
                    { id: lead.id, status },
                    "Đã cập nhật lịch lái thử.",
                  )
                }
              />
            )}
            {tab === "settings" && (
              <SettingsEditor
                key={snapshot.settings.siteName + snapshot.settings.logoUrl}
                settings={snapshot.settings}
                pending={pending}
                onSave={saveSettings}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
