/**
 * 浏览器端文件下载（v0.6.0）
 *
 * 通过 Blob + 临时 <a> 触发下载，不依赖任何后端。仅在客户端调用。
 */

/** 触发浏览器下载一个文本文件。 */
export function downloadFile(filename: string, content: string, mime: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 基于时间生成文件名后缀（YYYYMMDD-HHmmss）。 */
export function timestampSlug(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
