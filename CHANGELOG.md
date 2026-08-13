# Changelog

所有重要变更记录于此文件。格式参考 [Keep a Changelog](https://keepachangelog.com/)，版本号遵循 [SemVer](https://semver.org/)。

## [0.2.0] - 2026-08-13（候选）

> 状态：本地候选提交，尚未推送 / 打 Tag / 发布 Release（需人工确认）。

### Added
- CSV / XLSX 文件导入：浏览器端解析，不落盘、不联网。
- Excel 多工作表列举与切换选择（XLSX）。
- 字段映射：源列映射到 Space / Asset / Sensor 模型字段，并按表头给出智能默认映射（中英文别名归一化）。
- 导入校验：确认映射后按现有 Zod 模型逐行校验，给出通过计数与带行号的中文错误（如「第 3 行：ID不能为空」「类型取值不在允许范围」）。
- 可空字段（如 Space.parentId）的空单元格归一化为 null，对应「无父级」。
- 对不支持格式、空文件、无法解析文件给出明确中文提示。
- 首页新增「导入数据」入口；复用 DataTable / ErrorState 组件。
- 新增依赖：`papaparse`（CSV）、`xlsx`（SheetJS，XLSX）；均为浏览器端库。
- 单元测试：导入解析（CSV/XLSX 夹具、格式识别、错误归一化）、表头自动匹配、映射变换、Zod 校验集成（合法/非法行、必填缺失、枚举非法），共 19 项导入相关测试。

### 范围边界（v0.2.0 不实现）
- 校验规则引擎与问题分级（v0.3）。
- 对象关系图与孤立对象可视化（v0.4）。
- 项目保存与恢复（v0.4）。
- AI 映射 / 规则建议（v0.5）。
- 报告（HTML / JSON）导出（v0.6）。

### 已知问题
- 文件选择后的映射与校验交互为客户端流程，已通过单元测试覆盖核心逻辑；真实「选择文件→预览→映射→校验」的端到端点击验证待引入 Playwright 后补齐。
- XLSX 使用 SheetJS 0.18.5（npm 最新发布版），满足读取与多工作表列举需求。

[0.2.0]: https://github.com/hunterwalks/twinflow-studio/releases/tag/v0.2.0

## [0.1.0] - 2026-08-13（已发布）

> 状态：已发布 v0.1.0 Release（用户经 GitHub Desktop / 网页人工发布）。

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
