import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "cdn.honda.com.vn" },
      { protocol: "https", hostname: "yamaha-motor.com.vn" },
      { protocol: "https", hostname: "shop.vinfastauto.com" },
      { protocol: "https", hostname: "vinfastauto.com" },
      { protocol: "https", hostname: "yadea.com.vn" },
      { protocol: "https", hostname: "dat.bike" },
      { protocol: "https", hostname: "img.vietqr.io" },
    ],
    formats: ["image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'",
          },
        ],
      },
    ];
  },
};
export default nextConfig;
