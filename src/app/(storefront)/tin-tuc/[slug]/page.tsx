import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { articles } from "@/lib/articles";
import { siteUrl } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const slug = (await params).slug;
  const article = articles.find((a) => a.slug === slug);
  return article
    ? {
        title: article.title,
        description: article.summary,
        alternates: { canonical: siteUrl() + "/tin-tuc/" + slug },
      }
    : { title: "Không tìm thấy bài viết" };
}
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();
  return (
    <div className="container section">
      <article className="content-prose">
        <Link href="/tin-tuc" className="text-link mb-5">
          ← Cẩm nang chọn xe
        </Link>
        <span className="eyebrow">{article.tag}</span>
        <h1>{article.title}</h1>
        <p>{article.summary}</p>
        {article.sections.map((s) => (
          <section key={s.title}>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
        <p className="notice mt-8">
          Nội dung biên soạn bởi MotoShop. Đối chiếu hướng dẫn và thông số của
          nhà sản xuất cho đúng mẫu xe và phiên bản bạn chọn.
        </p>
        <Link href="/xe" className="btn mt-7">
          Khám phá các mẫu xe
        </Link>
      </article>
    </div>
  );
}
