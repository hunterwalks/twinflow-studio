#!/bin/bash
# TwinFlow Studio 本地构建脚本（Windows 环境 worker 崩溃问题的稳健版）
# 用法: bash scripts/build-local.sh [attempt_label]
# 要点:
#   1. 构建前把旧 .next 改名让位，避免 next build 清理 .next 被安全删除守卫拦截；
#   2. 全部输出重定向到 build_log.txt，即使 shell 被异常终止日志仍在；
#   3. 清空外部 NODE_OPTIONS，避免机器级选项影响 Next.js 子进程；
#   4. next.config 的 experimental.cpus=1 限制 worker 数，规避 Windows 下
#      多 worker 并发派生的偶发 STATUS_DLL_INIT_FAILED (0xC0000142)。
set -u
cd "$(dirname "$0")/.." || exit 1
export NODE_OPTIONS=""

LABEL="${1:-manual}"
if [ -d .next ]; then
  mv .next ".next_prev_${LABEL}"
  echo "[build-local] moved .next -> .next_prev_${LABEL}"
fi

echo "[build-local] start build (label=${LABEL}) at $(date +%H:%M:%S)"
node node_modules/next/dist/bin/next build > build_log.txt 2>&1
echo "[build-local] build process exited: $?" >> build_log.txt
tail -5 build_log.txt
