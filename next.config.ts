import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Docker (o'z serverda) uchun yengil standalone build
  output: "standalone",
  // Next.js dev indikatorini (N tugmasi / "Rendering...") yashirish
  devIndicators: false,
  // Turbopack root'ini shu loyihaga qattiq belgilash (boshqa lockfile'lar tufayli)
  turbopack: {
    root: import.meta.dirname,
  },
  // Reverse proxy ortida server action'lar ishlashi uchun ruxsat etilgan domenlar
  experimental: {
    serverActions: {
      allowedOrigins: ["helper-vagons.d-railway.uz", "*.d-railway.uz"],
    },
  },
};

export default withNextIntl(nextConfig);
