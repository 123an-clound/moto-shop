import type { Metadata } from "next";
import Link from "next/link";
import { Bike, Zap, CalendarCheck } from "lucide-react";
import { articles } from "@/lib/articles";
export const metadata: Metadata = {
  alternates: { canonical: "/tin-tuc" },
  title: "Cẩm nang chọn xe",
  description:
    "Tìm hiểu cách chọn xe máy, đọc thông số xe điện và chuẩn bị cho buổi lái thử cùng MotoShop.",
};
export default function ArticlesPage() {
  return (
    <div className="container section">
      <div className="page-intro">
        <span className="eyebrow">Cẩm nang MotoShop</span>
        <h1 className="page-title">Hiểu xe. Chọn đúng.</h1>
        <p className="page-description">
          Những thông tin cơ bản để chuẩn bị cho chiếc xe tiếp theo.
        </p>
      </div>
      <div className="news-grid mb-12">
        {articles.map((a, i) => (
          <Link
            key={a.slug}
            className="article-card"
            href={"/tin-tuc/" + a.slug}
          >
            <div className="article-cover">
              <span>{a.cover}</span>
              {i === 0 ? <Bike /> : i === 1 ? <Zap /> : <CalendarCheck />}
            </div>
            <span className="article-tag">{a.tag}</span>
            <h2 className="text-xl mt-3">{a.title}</h2>
            <p>{a.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
