import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  const url = siteUrl();
  return url.startsWith("https://")
    ? {
        rules: {
          userAgent: "*",
          allow: "/",
          disallow: ["/admin", "/api/", "/gio-hang", "/tra-cuu"],
        },
        sitemap: url + "/sitemap.xml",
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
