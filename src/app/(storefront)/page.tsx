import type { Metadata } from "next";
import Link from "next/link";
import Image from "@/components/storefront/image";
import {
  ArrowRight,
  ArrowUpRight,
  Bike,
  Zap,
  ShieldCheck,
  CalendarCheck,
  SlidersHorizontal,
  Wallet,
  MapPin,
} from "lucide-react";
import { getProducts, getSettings } from "@/lib/repository";
import { ProductCard } from "@/components/storefront/product-card";
import { Hero } from "@/components/storefront/hero";
import { articles } from "@/lib/articles";
export const metadata: Metadata = { alternates: { canonical: "/" } };
export default async function Home() {
  const [products, settings] = await Promise.all([
    getProducts(),
    getSettings(),
  ]);
  const featured = products.filter((p) => p.featured).slice(0, 8);
  const electric =
    products.find((p) => p.type === "electric" && p.featured) ||
    products.find((p) => p.type === "electric");
  return (
    <>
      <Hero
        products={products.filter(
          (p) =>
            p.slug === "honda-sh350i" ||
            p.id === electric?.id ||
            settings.heroBanners.some((b) => b.href === "/xe/" + p.slug),
        )}
        settings={settings}
      />
      <div className="container">
        <div className="brand-row">
          <span>
            NHỮNG HÃNG XE
            <br />
            BẠN QUEN THUỘC
          </span>
          {["Honda", "Yamaha", "VinFast", "YADEA", "Dat Bike"].map((b) => (
            <Link
              key={b}
              href={"/xe?hang=" + encodeURIComponent(b)}
              className={
                b === "Honda" ? "honda" : b === "Dat Bike" ? "datbike" : ""
              }
            >
              {b === "Honda"
                ? "HONDA"
                : b === "VinFast"
                  ? "VINFAST"
                  : b === "Yamaha"
                    ? "YAMAHA"
                    : b}
            </Link>
          ))}
        </div>
        <div className="quick-categories">
          <Link href="/xe?loai=gasoline" className="category-tile">
            <div>
              <span className="eyebrow">Nhịp phố & những cung đường</span>
              <h2>
                Xe máy xăng <ArrowUpRight size={19} className="inline" />
              </h2>
              <p>
                {products.filter((p) => p.type === "gasoline").length} mẫu xe •
                Honda, Yamaha
              </p>
            </div>
            <span className="category-icon">
              <Bike size={30} />
            </span>
          </Link>
          <Link href="/xe?loai=electric" className="category-tile electric">
            <div>
              <span className="eyebrow">Một cách di chuyển mới</span>
              <h2>
                Xe máy điện <ArrowUpRight size={19} className="inline" />
              </h2>
              <p>
                {products.filter((p) => p.type === "electric").length} mẫu xe •
                VinFast, YADEA, Dat Bike
              </p>
            </div>
            <span className="category-icon">
              <Zap size={28} />
            </span>
          </Link>
        </div>
        {settings.blocks.featured && (
          <section className="section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Bộ sưu tập MotoShop</span>
                <h2>Những mẫu xe nổi bật</h2>
                <p>Một lựa chọn mới cho hành trình quen thuộc.</p>
              </div>
              <Link href="/xe" className="text-link">
                Xem tất cả xe <ArrowRight size={17} />
              </Link>
            </div>
            <div className="product-grid">
              {featured.map((p) => (
                <ProductCard product={p} key={p.id} />
              ))}
            </div>
            <p className="reference-note">
              Giá tham khảo theo phiên bản từ nhà sản xuất, chưa bao gồm chi phí
              lăn bánh. Vui lòng xem điều kiện và ngày cập nhật tại trang chi
              tiết.
            </p>
          </section>
        )}
        {settings.blocks.electric && electric && (
          <section className="section pt-0">
            <div className="electric-feature">
              <div>
                <span className="eyebrow">
                  <Zap size={14} /> Di chuyển cùng điện năng
                </span>
                <h2>
                  Nhẹ nhịp phố.
                  <br />
                  Mở lối tương lai.
                </h2>
                <p>
                  Khám phá xe điện với thông số pin và công suất rõ ràng. Tìm
                  chiếc xe phù hợp với cách bạn di chuyển.
                </p>
                <Link className="btn btn-blue" href="/xe?loai=electric">
                  Khám phá xe điện <ArrowRight size={17} />
                </Link>
              </div>
              <Link
                href={"/xe/" + electric.slug}
                className="electric-visual"
                aria-label={"Xem " + electric.name}
              >
                <Image
                  src={electric.variants[0].images[0]}
                  alt={electric.name}
                  fill
                  sizes="(max-width:767px) 80vw,550px"
                />
                <span className="electric-range">
                  <strong>{electric.brand}</strong>
                  {electric.name.replace(electric.brand, "").trim()}
                </span>
              </Link>
            </div>
          </section>
        )}
        <div className="benefits">
          {[
            {
              icon: ShieldCheck,
              title: "Thông tin minh bạch",
              text: "Giá, phiên bản & nguồn hãng",
            },
            {
              icon: CalendarCheck,
              title: "Trải nghiệm trước",
              text: "Đăng ký lịch lái thử thuận tiện",
            },
            {
              icon: SlidersHorizontal,
              title: "Chọn xe theo nhu cầu",
              text: "Lọc thông số, hãng & ngân sách",
            },
            {
              icon: Wallet,
              title: "Dự tính khoản trả góp",
              text: "Ước tính chi phí theo kỳ hạn",
            },
          ].map((b) => (
            <div className="benefit" key={b.title}>
              <b.icon size={27} />
              <div>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </div>
            </div>
          ))}
        </div>
        {settings.blocks.news && (
          <section className="section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Cẩm nang & trải nghiệm</span>
                <h2>Hiểu xe. Chọn đúng.</h2>
              </div>
              <Link href="/tin-tuc" className="text-link">
                Đọc cẩm nang <ArrowRight size={17} />
              </Link>
            </div>
            <div className="news-grid">
              {articles.map((a, i) => (
                <Link
                  key={a.slug}
                  href={"/tin-tuc/" + a.slug}
                  className="article-card"
                >
                  <div className="article-cover">
                    <span>{a.cover}</span>
                    {i === 0 ? <Bike /> : i === 1 ? <Zap /> : <CalendarCheck />}
                  </div>
                  <span className="article-tag">{a.tag}</span>
                  <h3>{a.title}</h3>
                  <p>{a.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
        {settings.blocks.reviews && Boolean(settings.reviews?.length) && (
          <section className="section pt-0">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Những trải nghiệm được chia sẻ</span>
                <h2>Khách hàng kể chuyện xe</h2>
              </div>
            </div>
            <div className="review-grid">
              {settings.reviews?.map((r) => (
                <figure className="review-card" key={r.id}>
                  <div
                    className="review-stars"
                    aria-label={r.rating + " trên 5 sao"}
                  >
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </div>
                  <blockquote>{r.quote}</blockquote>
                  <figcaption>
                    <strong>{r.name}</strong>
                    <span>{r.model}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}
        {settings.blocks.showrooms && (
          <section className="section pt-0">
            <div className="showroom-callout">
              <div className="showroom-art">
                <MapPin />
              </div>
              <div className="showroom-copy">
                <span className="eyebrow">Hẹn gặp tại showroom</span>
                <h2>
                  Chiếc xe phù hợp
                  <br />
                  bắt đầu từ trải nghiệm.
                </h2>
                <p>
                  Xem xe, cảm nhận tư thế ngồi và trao đổi với nhân viên trước
                  khi quyết định.
                </p>
                <Link href="/showroom" className="btn btn-outline">
                  Showroom & đăng ký lái thử <ArrowUpRight size={17} />
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
