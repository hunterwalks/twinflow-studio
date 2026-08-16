/** @type {import('next').NextConfig} */
// v0.7.0：支持静态导出以部署到 GitHub Pages 等免费静态托管。
// 本地开发与 E2E 默认不导出（EXPORT 未设置），保持 `next dev` / `next start` 可用；
// 部署时在 CI 中设置 EXPORT=true 与 BASE_PATH（如 /twinflow-studio）生成静态产物。
const isExport = process.env.EXPORT === "true";
const basePath = process.env.BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  // lint 已在 CI / 本地作为独立质量门运行，构建内不再重复执行 ESLint
  eslint: { ignoreDuringBuilds: true },
  ...(isExport
    ? {
        output: "export",
        images: { unoptimized: true },
        basePath,
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
