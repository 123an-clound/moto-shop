import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/repository";
const vietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
  variable: "--font-vietnam",
  display: "swap",
});
const condensed = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["700"],
  preload: false,
  variable: "--font-condensed",
  display: "swap",
});
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: settings.siteName + " | Chọn xe. Chọn chất riêng.",
      template: "%s | " + settings.siteName,
    },
    description:
      "Khám phá xe máy Honda, Yamaha, VinFast, YADEA và Dat Bike. So sánh thông số, tính trả góp và đăng ký lái thử.",
    icons: { icon: settings.faviconUrl || "/favicon.svg" },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: settings.siteName,
      title: settings.siteName,
      description: "Khám phá xe xăng & xe điện. Tìm chiếc xe phù hợp với bạn.",
      images: ["/opengraph-image"],
    },
    twitter: { card: "summary_large_image" },
    robots: siteUrl.startsWith("https://")
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#c7252b",
};
const themeScript =
  "(function(){try{var t=localStorage.getItem('motoshop-theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light')}catch(e){}})();";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={vietnam.variable + " " + condensed.variable}>
        {children}
      </body>
    </html>
  );
}
