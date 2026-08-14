/**
 * 字符串相似度工具（v0.5.0）
 * 用于「确定性字段映射建议」：在表头别名精确匹配之外，提供可解释的模糊匹配打分。
 *
 * 设计原则：
 * - 纯函数、确定性：同一对字符串必然得到同一相似度。
 * - 不依赖任何外部 AI / 网络；基于归一化 + Levenshtein 距离 + 子串增强。
 */

/** 轻量归一化：小写、去首尾空白、剔除常见分隔与标点。 */
export function normalizeLoose(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\s_\-./()（）:：·,，]/g, "");
}

/** Levenshtein 编辑距离（迭代实现，避免长字符串递归）。 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * 字符串相似度，返回 [0, 1]。
 * - 完全相等（归一化后）返回 1。
 * - 否则按 Levenshtein 比率计算，并对「包含关系」做增强（短串是长串的子串时给到更高分）。
 * 结果四舍五入到千分位，保证确定性。
 */
export function similarity(a: string, b: string): number {
  const na = normalizeLoose(a);
  const nb = normalizeLoose(b);
  if (na === nb) return 1;
  if (na.length === 0 || nb.length === 0) return 0;

  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  let ratio = 1 - dist / maxLen;

  // 子串增强：仅当短串是长串的一部分、且两串长度相近（短/长 >= 0.6）、
  // 且长串相对短串仅多出 <=1 个字符（如「空间名」之于「空间名称」）时，
  // 才给出较高相似度。避免把埋在长乱码里的短别名（如「随机备注列」中的「备注」）误判为高相似。
  const shorter = Math.min(na.length, nb.length);
  const longer = Math.max(na.length, nb.length);
  if ((na.includes(nb) || nb.includes(na)) && shorter / longer >= 0.6 && longer - shorter <= 1) {
    ratio = Math.max(ratio, 0.5 + 0.5 * (shorter / longer));
  }

  return Math.round(ratio * 1000) / 1000;
}
