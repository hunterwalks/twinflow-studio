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
  // 类型检查由独立的 `tsc --noEmit` 质量门负责（见 package.json scripts），
  // 构建内不再重复执行，避免重复耗时。
  typescript: { ignoreBuildErrors: true },
  // 构建 worker 限制为 1 个：本机 Windows 环境下 jest-worker 并发派生多个子进程时，
  // 偶发 STATUS_DLL_INIT_FAILED (0xC0000142) 导致构建崩溃；单 worker 稳定。
  // 本项目仅 10 个静态页，CI（ubuntu）无此问题且性能影响可忽略。
  experimental: { cpus: 1 },
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
