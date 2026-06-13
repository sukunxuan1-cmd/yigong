/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const isPages = process.env.BUILD_TARGET === "pages";

const nextConfig = {
  reactStrictMode: true,
  // GitHub Pages：静态导出 + 子路径
  ...(isPages
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
        basePath: basePath || undefined,
        assetPrefix: basePath || undefined,
      }
    : {}),
};

export default nextConfig;
