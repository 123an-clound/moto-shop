import { Header, Footer } from "@/components/storefront/header";
import { StoreProvider } from "@/components/storefront/providers";
import { getSettings } from "@/lib/repository";
import { PromotionPopup } from "@/components/storefront/promotion-popup";
export const dynamic = "force-dynamic";
export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  return (
    <StoreProvider>
      <a href="#main-content" className="skip-link">
        Đến nội dung chính
      </a>
      <div
        style={{ "--primary": settings.primaryColor } as React.CSSProperties}
      >
        <Header settings={settings} />
        <main id="main-content">{children}</main>
        <Footer settings={settings} />
        {settings.popup && <PromotionPopup text={settings.popup} />}
      </div>
    </StoreProvider>
  );
}
