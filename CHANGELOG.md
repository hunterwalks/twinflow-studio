# Changelog

所有重要变更记录于此文件。格式参考 [Keep a Changelog](https://keepachangelog.com/)，版本号遵循 [SemVer](https://semver.org/)。

## [0.1.0] - 2026-08-13（候选）

> 状态：本地候选提交，尚未推送 / 打 Tag / 发布 Release（需人工确认）。

### Added
- 应用骨架：Next.js 15 + TypeScript + Tailwind CSS，Local-first，无后端、无 AI、无外部依赖。
- 内置「合成工业园区」Demo 数据，包含 Space / Asset / Sensor 三类合成对象及引用关系。
- 首页可一键进入 Demo；Demo 展示对象数量概览与工作表式数据预览（Space / Asset / Sensor 切换）。
- 空状态（`?view=empty`）与错误状态（`?view=error`）的可理解提示。
- Zod 领域模型（Space / Asset / Sensor）与确定性数据完整性约束。
- Vitest 单元测试底座：schema 校验、数据引用完整性、Demo 加载状态机、工作表列/行派生。
- 工程治理：`.gitignore`（覆盖 `.env`、密钥与构建产物）、`LICENSE`（MIT）、`.env.example` 占位。

### 范围边界（v0.1.0 不实现）
- CSV / XLSX 文件导入、字段映射。
- 确定性校验规则引擎、问题溯源。
- 对象关系图、孤立对象可视化。
- AI 映射 / 规则建议。
- 报告（HTML / JSON）导出、项目保存与恢复。

### 已知问题
- v0.1.0 浏览器验证通过 HTTP/SSR 抓取页面并断言关键内容；可视化截图与 E2E 将在 v0.2 引入 Playwright 后补齐。
- 合成数据仅一份工业园区样例，后续版本将支持更多样例与可配置接入。

[0.1.0]: https://github.com/hunterwalks/twinflow-studio/releases/tag/v0.1.0
