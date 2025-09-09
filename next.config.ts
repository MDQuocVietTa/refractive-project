import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },   // bỏ qua ESLint khi build
  // tùy chọn: nếu còn lỗi TS muốn bỏ qua tạm
  // typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
