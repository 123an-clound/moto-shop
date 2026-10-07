"use client";
import Link from "next/link";
import Image from "@/components/storefront/image";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import {
  ArrowUpRight,
  Bike,
  ShoppingBag,
  Menu,
  X,
  Search,
  Sun,
  Moon,
  House,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { useCart } from "./providers";
import type { SiteSettings } from "@/types";
import { cn } from "@/lib/utils";

function themeSubscribe(callback: () => void) {
  window.addEventListener("theme-change", callback);
  return () => window.removeEventListener("theme-change", callback);
}
function themeSnapshot() {
  return document.documentElement.dataset.theme === "dark";
}
export function ThemeToggle() {
  const dark = useSyncExternalStore(themeSubscribe, themeSnapshot, () => false);
  function toggle() {
    const theme = dark ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("motoshop-theme", theme);
    } catch {}
    window.dispatchEvent(new Event("theme-change"));
  }
  return (
    <button
      type="button"
      className="icon-button"
      onClick={toggle}
      aria-label={
        dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"
      }
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
export function Wordmark({ settings }: { settings?: SiteSettings }) {
  return (
    <Link
      href="/"
      className="wordmark"
      aria-label={`${settings?.siteName ?? "MotoShop"} trang chủ`}
    >
      {settings?.logoUrl ? (
        <Image
          src={settings.logoUrl}
          alt={settings.siteName}
          width={150}
          height={40}
          className="brand-logo"
        />
      ) : settings?.siteName && settings.siteName !== "MotoShop" ? (
        <>
          <Bike size={29} />
          <span className="custom-brand">{settings.siteName}</span>
        </>
      ) : (
        <>
          <Bike size={29} strokeWidth={2.5} />
          <span>
            MOTO<span className="brand-accent">SHOP</span>
            <small>VIETNAM</small>
          </span>
        </>
      )}
    </Link>
  );
}
export function Header({ settings }: { settings: SiteSettings }) {
  const path = usePathname();
  const { items } = useCart();
  const [open, setOpen] = useState(false);
  const count = items.reduce((sum, x) => sum + x.quantity, 0);
  const links = [
    { href: "/xe", name: "Tất cả xe" },
    { href: "/xe?loai=gasoline", name: "Xe xăng" },
    { href: "/xe?loai=electric", name: "Xe điện" },
    { href: "/showroom", name: "Showroom" },
    { href: "/tin-tuc", name: "Cẩm nang" },
  ];
  return (
    <>
      {settings.topBar && (
        <div className="announcement">
          <span>{settings.topBar}</span>
          <Link href="/tra-cuu">
            Tra cứu đơn hàng <ArrowUpRight size={13} />
          </Link>
        </div>
      )}
      <header className="site-header">
        <div className="container header-inner">
          <Wordmark settings={settings} />
          <nav className="desktop-nav" aria-label="Điều hướng chính">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  path === "/xe" && link.href === "/xe" && "active",
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <Link href="/xe?tim=" className="icon-button" aria-label="Tìm xe">
              <Search size={20} />
            </Link>
            <ThemeToggle />
            <Link
              href="/gio-hang"
              className="icon-button cart-icon"
              aria-label={`Giỏ hàng, ${count} sản phẩm`}
            >
              <ShoppingBag size={20} />
              {count > 0 && <span>{count}</span>}
            </Link>
            <button
              type="button"
              className="icon-button mobile-menu-toggle"
              aria-label={open ? "Đóng menu" : "Mở menu"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="mobile-menu" aria-label="Menu di động">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
              >
                {link.name}
                <ArrowUpRight size={18} />
              </Link>
            ))}
            <Link href="/tra-cuu" onClick={() => setOpen(false)}>
              Tra cứu đơn hàng
            </Link>
          </nav>
        )}
      </header>
      <nav className="mobile-bottom-nav" aria-label="Điều hướng nhanh">
        <Link href="/" className={path === "/" ? "active" : ""}>
          <House size={20} />
          <span>Trang chủ</span>
        </Link>
        <Link href="/xe" className={path.startsWith("/xe") ? "active" : ""}>
          <Bike size={20} />
          <span>Chọn xe</span>
        </Link>
        <Link href="/showroom">
          <MapPin size={20} />
          <span>Showroom</span>
        </Link>
        <Link href="/gio-hang">
          <ShoppingBag size={20} />
          <span>Giỏ hàng{count > 0 ? ` (${count})` : ""}</span>
        </Link>
      </nav>
    </>
  );
}
export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Wordmark settings={settings} />
          <p>
            Cùng bạn chọn chiếc xe phù hợp.
            <br />
            Xe xăng, xe điện và những hành trình mới.
          </p>
          <div className="footer-note">
            Giá tham khảo từ nhà sản xuất.
            <br />
            Giá cuối cùng được xác nhận khi đặt xe.
          </div>
        </div>
        <div>
          <h2>Khám phá</h2>
          <Link href="/xe?loai=gasoline">Xe máy xăng</Link>
          <Link href="/xe?loai=electric">Xe máy điện</Link>
          <Link href="/tin-tuc">Cẩm nang chọn xe</Link>
        </div>
        <div>
          <h2>Hỗ trợ mua xe</h2>
          <Link href="/showroom">Showroom & lái thử</Link>
          <Link href="/tra-cuu">Tra cứu đơn hàng</Link>
          <Link href="/chinh-sach">Đặt xe & thanh toán</Link>
          <Link href="/chinh-sach#bao-mat">Bảo mật thông tin</Link>
        </div>
        <div>
          <h2>Kết nối {settings.siteName}</h2>
          {settings.contactPhone ? (
            <a href={`tel:${settings.contactPhone}`}>{settings.contactPhone}</a>
          ) : (
            <Link href="/showroom" className="footer-contact">
              Đăng ký tư vấn <ArrowUpRight size={18} />
            </Link>
          )}
          {settings.contactEmail && (
            <a href={`mailto:${settings.contactEmail}`}>
              {settings.contactEmail}
            </a>
          )}
          <p>{settings.address || "Địa chỉ và hotline đang được cập nhật."}</p>
          <Link href="/admin" className="admin-link">
            Quản trị cửa hàng
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} {settings.siteName}
        </span>
        <span>
          <CalendarDays size={14} /> Hẹn lái thử. Chọn xe tự tin.
        </span>
      </div>
    </footer>
  );
}
