import { ImageResponse } from "next/og";
export const alt = "MotoShop Vietnam - Chọn xe. Chọn chất riêng.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#f5f5f5",
        display: "flex",
        flexDirection: "column",
        padding: 80,
        color: "#1a1a1d",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 32, fontWeight: 900 }}>
        MOTO<span style={{ color: "#c7252b" }}>SHOP</span>
        <span style={{ fontSize: 18, marginLeft: 25, alignSelf: "center" }}>
          VIETNAM
        </span>
      </div>
      <div
        style={{
          fontSize: 82,
          fontWeight: 900,
          display: "flex",
          flexDirection: "column",
          lineHeight: 1.2,
          marginTop: 70,
        }}
      >
        <span>Chọn xe.</span>
        <span style={{ color: "#c7252b" }}>Chọn chất riêng.</span>
      </div>
      <div style={{ marginTop: 45, fontSize: 25, display: "flex" }}>
        Xe máy xăng · Xe máy điện · Trải nghiệm lái thử
      </div>
    </div>,
    size,
  );
}
