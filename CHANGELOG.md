# Changelog

所有重要变更记录于此文件。格式参考 [Keep a Changelog](https://keepachangelog.com/)，版本号遵循 [SemVer](https://semver.org/)。

## [1.1.0] - 2026-08-20

> 路线图阶段 B 起点：可配置模型与规则。在不破坏既有 24 条内置规则的前提下，引入版本化模型配置与「配置驱动规则包」，使校验引擎可由模型配置驱动；新增 `/model` 配置页用于查看、编辑、导入 / 导出模型与试用规则包。

### Added
- **模型配置（`lib/config/model.ts`）**：对象类型 / 字段 / 枚举 / 关系的版本化 JSON schema（`configVersion = 1`）与 Zod 校验；`defaultModelConfig()` 与四表核心模型一致；`migrateModelConfig` / `validateModelConfig` 支持语义级错误定位。
- **配置驱动规则（`lib/config/rules.ts`）**：`buildConfigRules(model)` 由模型配置动态生成通用规则（必填 / 枚举 / 引用完整性 / 唯一），确定性、可溯源，ID 以 `C-` 前缀。
- **规则包（`lib/rules/packages.ts`）**：`BUILTIN_PACKAGE`（24 条）与 `CONFIG_PACKAGE`（由模型生成）可独立启用 / 关闭；`getEnabledRules` 组合所选包。关闭内置包后校验完全由模型配置驱动。
- **`/model` 配置页**：可读视图 + JSON 编辑（实时校验）+ 配置导入 / 导出 + 规则包开关 + 「在已加载数据上试运行」；导航栏加入口。
- **`ProjectState.modelConfig`**：模型配置随项目持久化（`persist.ts` v2 透传），数据导入 / Demo 载入时保留。

### Changed
- `RuleContext` 增加 `typeIdSet` / `hasType`，为配置驱动规则提供按类型索引（非破坏）。
- 单测新增 `config.test.ts`（17 项）：配置校验 / 迁移 / 配置规则语义 / 规则包选择。

### 非目标（本版本不做）
- 图形化低代码平台；自定义（第 5+）对象类型的端到端校验（schema 已支持、可查看导出，校验留待后续版本）。

## [1.0.0] - 2026-08-20（候选）

> 路线图阶段 A 收官：首个稳定可公开推荐版本。在 v0.9.0 治理闭环之上，补齐大表可用性与离线帮助，使陌生用户无需改代码即可稳定走完「导入 → 建模 → 校验 → 修复 → 导出 / 对比」全链路，并明确隐私与数据安全边界。全部为确定性纯函数与本地计算，无 AI / 后端依赖。

### Added
- **全局导航栏**（`components/NavBar.tsx` + `layout.tsx`）：所有页面统一入口，含「帮助」离线页；版本号常驻展示。
- **离线帮助页 `/help`**：内置快速开始、隐私与安全（本地优先 / 无 AI 外发 / 本地存储键名与清空方式）、四表数据模型说明与常见问题（FAQ），完全离线可读，无网络依赖。
- **大表虚拟滚动**（`components/DataTable.tsx` + `lib/table.ts` 的 `visibleRange`）：超过 100 行时仅渲染可视区间行（固定行高窗口化），并增加防御性边界收敛，避免越界输入导致 offsetY 溢出或空渲染。
- **分块校验**（`lib/rules/engine.ts` 的 `runRulesInBatches`）：按规则分批执行并合并，结果与 `runRules` 完全等价（确定性）；为后续大表异步分批校验留出统一入口，导入流程已切换接入。

### Changed
- 版本号升至 v1.0.0；首页、README、CHANGELOG 同步更新。

### Quality
- 新增测试：虚拟滚动区间（`perf.window.test.ts`：顶部 / 中部 / 底部收敛 / 空数据 / 默认 overscan）；分块校验等价性（`rules.batch.test.ts`：任意 batchSize 与 runRules 完全等价、onBatch 进度回调、batchSize<1 兜底）。
- 全量单测 **208 → 216** 通过；typecheck / ESLint / 生产构建 / E2E 五道质量门复核。

## [0.9.0] - 2026-08-19（候选）

> 路线图阶段 B：从「能校验」到「能治理」。在 v0.8.0 的四表项目与 19 条规则之上，补齐观测域规则、一键修复与预览、项目元信息与跨表检索、跨项目对比，让质量治理闭环可在界面内完成。不引入 AI / 后端，全部为确定性纯函数与本地计算。

### Added
- **规则扩展 R020–R024**（`src/lib/rules/rules/observation.ts`，规则总数 **19 → 24**）：R020 观测量纲与单位不匹配（warning，复用量纲对照表）、R021 观测质量标记非法（warning）、R022 观测时间戳超出合理范围（warning）、R023 测点无任何观测（info，覆盖度）、R024 观测缺失量纲或单位（warning）。观测表为空时统一跳过并标注原因，**不破坏**既有「Demo 零问题」与含问题样例的触发基线。
- **问题修复预览引擎**（`src/lib/fixes.ts`）：为可确定性修复的问题生成 before→after 建议并一键应用。支持 R003 去空白、R004 截断超长名称、R009 解除父级自引用、R015 / R020 单位归一为量纲标准单位；其余无法安全推断目标值的规则返回不可自动修复，交由用户手动处理。`applyFix` 为不可变更新，应用前校验目标值未被并发改动，契合 local-first / 确定性原则。
- **/validate 一键修复 UI**：问题清单为可修复项内联渲染「修复预览（当前值 → 建议值）+ 应用修复」按钮，点击后重新校验、对应问题消失；切换数据集自动重置工作副本，不影响内置样例常量。
- **项目元信息（`ProjectState.metadata`）**：可选字段 name / description / owner，`/project` 页可编辑保存，随项目 JSON 导出与导入往返恢复（`io.ts` / `persist.ts` 透传，旧存档兼容为未设置）。
- **跨表检索**（`src/lib/project/search.ts`）：在 Space / Asset / Sensor / Observation 四表中按 ID / 名称模糊查找（大小写不敏感、确定性排序、每条记录至多命中一次），`/project` 页提供检索框与结果列表。
- **跨项目对比**（`src/lib/compare.ts` + `/compare` 页）：并排对比「当前项目」与内置样例（或任意两个样例）的总记录数、分表记录数、质量评分（0–100）、问题总数与分级计数、命中 / 通过 / 跳过规则数，以及双方命中最多的 Top 3 问题规则；数值差异自动标注更优方（高优 / 低优 / 持平 / 不适用）。

### Changed
- 版本号升至 v0.9.0；首页、README、CHANGELOG 同步更新。
- `next.config.mjs`：构建 worker 限制为 1（`experimental.cpus: 1`），规避 Windows 本机多 worker 并发派生的偶发 STATUS_DLL_INIT_FAILED；关闭 Next 内置类型检查 worker（`typescript.ignoreBuildErrors`），类型安全由独立 `tsc --noEmit` 质量门保证。
- 新增 `scripts/build-local.sh`：本机构建脚本，改名让位旧 `.next`、覆盖 `NODE_OPTIONS`（去掉 safe-delete shim）并限制 worker 数，解决本机 `next build` 结尾清理临时目录被安全删除守卫超时误报的问题。

### Quality
- 新增测试：修复引擎（`fixes.test.ts`：R003 / R004 / R009 / R015 / R020 命中与不命中、不可修复返回 null、applyFix 不可变与并发保护）；元信息与检索（`project.metadata.test.ts`：searchProject 跨表命中 / 空查询 / limit、serialize↔parse 元信息往返、非法形状宽松转换、v1 迁移无元信息）；跨项目对比（`compare.test.ts`：画像字段自洽、方向判定、持平 / 不适用指标）。
- 规则引擎断言更新：规则总数 19 → 24、干净数据 passed 19 / skipped 5、messyPark 触发 14 / skipped 5；`page.tsx` 文案与 `messyPark.ts` 注释同步。
- 新增 `e2e/v09.spec.ts`：修复预览可应用且问题数下降、干净数据无修复按钮（无假阳性）、对比页渲染与切换重算。
- 全仓测试数与五道质量门（typecheck / lint / unit / build / E2E）结果见交付记录 `Run_Record.md` / `Validation.md`。

## [0.8.0] - 2026-08-19（候选）

> 路线图阶段 A：用完整项目而非单张表工作。在 v0.7.0 的四道质量门（typecheck / lint / test / build）+ E2E 之上，把「单表导入 / 单数据集校验」提升为「以四表项目为单位的建模、保存、迁移与复用」。不引入 AI / 后端，复用既有校验、质量、报告与导入引擎。

### Added
- **四表项目模型（Space / Asset / Sensor / Observation）**：新增 **Observation（观测）** 表（`sensorId` + `timestamp` + `value` + 可选 `quantity` / `unit` / `quality`）；统一项目状态 `ProjectState` 升至 **v2**，`localStorage` 键保持 `twinflow-project-v1`，以 `version` 字段区分。
- **项目 JSON 导入 / 导出**（`src/lib/project/io.ts` + `/project` 页面）：将整个项目（四表 + 元数据）导出为确定性 JSON，再导入时**整体覆盖**当前项目并持久化；浏览器端 `Blob` 下载，不联网、不上传。
- **导入映射模板复用**（`src/lib/import/templates.ts`）：在 `/import` 页把当前列→字段映射存为命名模板（`localStorage` 键 `twinflow-mapping-templates`），下次一键套用 / 编辑 / 删除，跨会话可用。
- **v1 → v2 迁移**（`src/lib/project/persist.ts` 的 `migrateProjectV1ToV2`）：旧版三表项目（v1）自动补 `observations: []` 升级为 v2，保留既有空间 / 资产 / 测点；非预期结构回退空项目，不抛错。
- **Observation 专属校验规则 R016–R019**（纯函数、确定性、可溯源）：R016 Observation→Sensor 引用完整性（error，Sensor 表空时跳过并标注）、R017 观测时间非法（warning）、R018 观测值非法（error）、R019 同测点重复时间戳（warning）。规则总数 **15 → 19**。
- **Demo / 校验 / 报告四表贯通**：城市基础设施（干净）补 8 条合法观测（引用 SE-101~SE-108，零误报基线）；城市基础设施（含问题）补覆盖 R016–R019 的脏观测；`/demo` 新增 Observation 标签、`ObjectCounts` 增加观测计数卡、`/validate` 记录数与数据集引入 observations、`/report` 记录数汇总含观测。
- 新增 `src/lib/version.ts`（单一 `APP_VERSION` 常量，首页与版本文案统一引用，避免漂移）。

### Changed
- 版本号升至 v0.8.0；首页、README、CHANGELOG 同步更新。
- `cityInfraClean` 数据集由 `IndustrialPark` 调整为与 `cityInfraProblem` / `messyPark` 一致的 `RuleDataset`（含 `observations`），确保干净基线零误报且校验页直接消费。

### Quality
- 新增 12 项测试：项目 IO 往返（`project.io.test.ts`：导出→导入确定性、覆盖式写入、`version` 透传、非法 JSON 安全失败）；导入映射模板（`import.templates.test.ts`：保存 / 列出 / 套用 / 删除、覆盖同名、localStorage 容错）；v1→v2 迁移用例已在 `project.persist.test.ts` 补全。
- 既有规则数断言由 15 → 19；`ObjectCounts` 卡片加 `data-testid` 便于 E2E 断言；新增 `e2e/v08.spec.ts` 覆盖 v0.8 流程（Observation 导入、项目 JSON 导出→再导入、保存→重开→恢复、映射模板、旧项目迁移）。
- 全仓测试数与五道质量门（typecheck / lint / test / build / E2E）结果见交付记录 `Run_Record.md` / `Validation.md`。

## [0.7.0] - 2026-08-16（已发布）

> 公开 Beta 与可用性基线：在不增加数字孪生业务范围的前提下，把 v0.6.0 从「构建与单测通过」提升为「普通用户可直接访问、能按引导完成一次完整 Demo、失败后知道如何恢复」的 Beta。

### Added
- **公开静态托管（GitHub Pages）**：`next.config.mjs` 条件式静态导出（`EXPORT=true` + `BASE_PATH` → `out/`），新增 `.github/workflows/deploy.yml` 自动部署；local-first 不变（CSV/XLSX 仍在浏览器内解析，不上传业务后端）。
- **Playwright E2E**：新增 `.github/workflows/ci.yml` 全量质量门（typecheck / lint / test / build / E2E）；`e2e/flows.spec.ts` 覆盖 9 条主流程，全部使用 `data-testid` 稳定定位。
- **新手引导 / 隐私 / 错误恢复**：首页「5 步上手」与「数据在本地处理」说明；全局 `StorageBanner` 在 localStorage 不可用时给出原因与恢复动作；空/错误态给出明确原因与下一步；新增 `PRIVACY.md`。
- **两套城市基础设施合成数据**：「城市基础设施（干净）」与「城市基础设施（含问题）」，统一收口到 `src/lib/data/registry.ts`，Demo / 校验页 / E2E 共用；干净基线用于确认无规则误报。
- **ESLint CLI 迁移**：`.eslintrc.json` → `eslint.config.mjs`（FlatCompat extends `next/core-web-vitals` + `next/typescript`），消除 `next lint` 弃用警告；`lint` 脚本改为 `ESLINT_USE_FLAT_CONFIG=true eslint .`。
- 新增依赖：`@eslint/eslintrc`、`@playwright/test`。

### Changed
- 版本号升至 v0.7.0；首页、README、CHANGELOG 同步更新。
- `src/lib/loadDemo.ts` 的 `DemoResult.success.data` 由 `IndustrialPark` 收敛为统一的 `DemoDataset`（宽松记录），Demo / 校验页 / E2E 共用注册表。

### Quality
- 新增 E2E 9 条主流程；`loadDemo` 单测补充城市基础设施数据集用例。
- 既有单元测试保持不变；全仓测试数与四道质量门结果见交付记录 `Run_Record.md` / `Validation.md`。

## [0.6.0] - 2026-08-14（候选）

> 路线图 v0.1–v0.6 收官版本：在 v0.5.0 之上新增数据治理报告导出（HTML / JSON）。local-first、可离线、纯确定性。

### Added
- **报告聚合**（`src/lib/report/build.ts`）：由当前数据集一次性聚合出校验报告 + 质量评分（0–100 / 等级 A–E）+ 规则与治理建议，复用 v0.3–v0.5 的既有引擎，与页面展示完全一致；纯函数、确定性、可测试。
- **HTML 导出**（`src/lib/report/exporters.ts`）：生成**自包含** HTML（内联样式、可打印、可离线双击打开），含质量评分、校验汇总、问题清单（级别 / 表 / 定位 / 字段 / 描述 / 修复建议）与规则建议；所有动态文本经 HTML 转义，避免注入。
- **JSON 导出**：结构化 JSON（key 顺序固定、确定可复现），便于归档与二次处理。
- **`/report` 页面**：从统一项目状态读取当前数据，预览报告并提供「下载 JSON / 下载 HTML」按钮；空态提示先载入示例或导入数据。校验页新增「导出当前数据为完整报告 →」入口，首页新增「导出报告 →」卡片。
- 浏览器端 `Blob` 下载（`src/lib/report/download.ts`），不依赖后端、不上传数据。

### Quality
- 新增 7 项测试：聚合正确性（空数据集满分、确定性、重复 ID 触发 R006、记录数汇总）、导出（JSON 往返一致、HTML 关键区块、HTML 特殊字符转义防注入）。
- 全仓 **145 项**测试通过；typecheck / lint / test / build 四道质量门全绿。

## [0.5.0] - 2026-08-14（候选）

> 状态：本地候选提交，待推送 / 打 Tag / 发布 Release（本项目已授权，环境凭据不具备时交付人工发布文案）。

### Added
- **确定性字段映射建议**（v0.5.0，`src/lib/import/similarity.ts` + `src/lib/import/mapping.ts`）：在表头别名精确匹配之外，按 **置信度打分** 给出映射建议；匹配方式分 **精确 / 归一 / 模糊** 三档（基于归一化 + Levenshtein 相似度 + 子串增强）。高置信（≥0.85）自动映射，中置信（0.6–0.85）自动映射但标记「需复核」，低置信不自动映射。
- **导入页映射置信度 UI**：映射表每项展示匹配方式徽标（精确/归一/模糊）与置信度百分比；表头展示「高 / 中 / 低」置信度摘要。
- **数据质量评分**（`src/lib/quality/score.ts`）：将校验报告聚合成 **0–100 总分 + 等级 A–E**，按 6 个维度（完整性 / 唯一性 / 引用 / 层级 / 覆盖 / 规范）给出维度分、权重与主要扣分项；全部可解释、可溯源。
- **规则 / 治理建议**（`src/lib/quality/recommend.ts`）：扫描数据集信号，推荐应启用的内置规则（R001/R002/R005/R006/R008/R010/R011/R012/R014/R015 等）与自定义治理建议（如类型取值单一）；按 高 / 中 / 低 优先级排序，每条附中文原因。
- **质量评分与建议卡片**（`components/QualityScoreCard.tsx`、`components/RuleRecommendations.tsx`）：校验页在汇总后展示质量评分，在规则维度汇总后展示建议；导入页在规则引擎结果后展示质量评分与建议。
- 版本号升至 v0.5.0；首页与 README 同步更新。

### Quality
- 新增 20 项测试：相似度（归一化 / Levenshtein / 子串增强）、映射建议（三档判定 / 自动映射阈值 / 需复核 / 一对一）、质量评分（无问题=100A / 加权扣分 / 大量错误=0E / 因子排序）、规则建议（层级引用 / 重复ID+悬空+缺测点 / 空数据集 / 命名规范）。
- 既有映射测试（精确/别名/未匹配/一对一）保持不变并通过。
- 全仓 **138 项**测试通过；typecheck / lint / test / build 四道质量门全绿。

### 本版本不做（后续版本）
- 报告（HTML / JSON）导出 → v0.6

### 已知问题
- 映射置信度、质量评分与规则建议的端到端点击验证已由单元测试与构建保证，真实点击级验证待引入 Playwright 后补齐。
- 模糊匹配为确定性启发式，极端表头（如大量同义别称混用）可能出现中置信误映射，已通过「需复核」标记提示人工确认。

## [0.4.0] - 2026-08-13（候选）

> 状态：本地候选提交，待推送 / 打 Tag / 发布 Release（本项目已授权，环境凭据不具备时交付人工发布文案）。

### Added
- **对象关系图**（`/graph` 页面，基于 React Flow `@xyflow/react`）：以图可视化 Space / Asset / Sensor 的层级与引用结构，节点按类型配色、可缩放 / 拖拽 / fit view。
- **确定性布局**（`src/lib/graph/layout.ts`，纯函数）：按 Space/Asset/Sensor 分列、表内稳定排序，坐标确定无重叠；生成三类关系连线（父级 / 位于空间 / 挂载设备），目标缺失时跳过连线（由孤立识别标注）。
- **孤立 / 悬空对象识别**（`src/lib/graph/orphans.ts`）：识别悬空引用（parentId / spaceId / assetId 指向不存在对象）与层级不可达（无法从根空间到达的空间）；**被引用表为空时跳过跨表判定，不产生假阳性**；每条孤立对象给出中文原因。
- **关系图交互**：点击节点查看对象详情与孤立原因；「仅看孤立对象」开关；图例与节点计数。
- **项目保存与恢复**（`src/lib/project/*`）：统一项目状态（Context + Provider），当前数据（Demo 或导入结果）变更后自动写入浏览器 `localStorage`（键 `twinflow-project-v1`），**关闭重开自动恢复**；提供「清空项目」入口；写入失败（隐私模式 / 配额）静默降级。
- `/demo` 与 `/import` 在产出数据后写入统一项目状态，关系图可读取；`/demo`、`/import` 增加「在关系图中查看 →」链接。
- 首页新增「可视化对象关系图 →」入口；版本号升至 v0.4.0。
- 新增依赖 `@xyflow/react`（关系图渲染，浏览器端库）。

### Quality
- 新增 19 项测试：图布局（确定性 / 无重叠 / 分列 / 边数 / 空数据集）、孤立识别（命中 / 不命中 / 空表跳过 / 空间环不可达）、持久化（序列化往返 / 版本容错 / 脏数据回退）。
- 全仓 **118 项**测试通过；typecheck / lint / test / build 四道质量门全绿。

### 本版本不做（后续版本）
- AI 映射 / 规则建议 → v0.5
- 报告（HTML / JSON）导出 → v0.6

### 已知问题
- 关系图与保存恢复的端到端点击验证（含刷新后恢复、拖拽体验）尚未覆盖，核心逻辑已由单元测试与构建保证，E2E 待引入 Playwright 后补齐。
- 布局为分层基础布局（满足「基础节点和连线」），未做复杂自动布局编辑。

## [0.3.0] - 2026-08-13（已发布）

> 状态：本地候选提交，待推送 / 打 Tag / 发布 Release（本项目已授权，环境凭据不具备时交付人工发布文案）。

### Added
- 确定性校验规则引擎（`src/lib/rules/*`，纯 TS，无 AI、无网络、无持久化）。
- 内置 **15 条**校验规则，覆盖 6 个类别：完整性（R001/R003/R005）、唯一性（R006/R007）、引用完整性（R008/R009）、层级（R010/R011/R012）、覆盖度（R014）、规范性（R002/R004/R013/R015）。
- 问题**分级**：error（不可用）/ warning（可用但有治理风险）/ info（完整度与覆盖度提示）。
- 问题**可溯源**：每条问题定位到 表 / 行号 / 记录 ID / 字段，并给出中文描述与修复建议。
- 报告聚合：按级别、按表、按类别、按规则维度汇总；区分「命中规则数 / 通过规则数 / 跳过规则数」。
- **确定性输出**：排序键固定为 级别 → 表 → 行号 → 规则 ID → 字段，同一输入必然同输出。
- **假阳性防护**：当被引用表未导入（为空）时，跨表引用类规则自动跳过并在报告中标注「已跳过 + 原因」，避免把整表判为悬空引用。
- 规则作用于**宽松数据集**（`Record<string,string>[]`），可直接校验 v0.2.0 导入产物这类可能不合法的数据。
- 新增 `/validate` 页面：可切换「内置 Demo / 含问题样例 / 无根空间样例」，展示分级汇总、类别分布、规则维度汇总与可筛选问题清单。
- `/import` 页面在字段映射校验之后，追加规则引擎结果区块，并显式说明跨表规则被跳过。
- 首页新增「校验数据 →」入口；版本号升至 v0.3.0。
- 单元测试：15 条规则的命中 / 不命中用例（`rules.cases.test.ts`，40 项）、引擎与报告聚合（`rules.engine.test.ts`，21 项），连同 v0.1/v0.2 测试共 99 项全部通过。

### 范围边界（v0.3.0 不实现）
- 对象关系图与孤立对象可视化（v0.4）。
- 项目保存与恢复（v0.4）。
- AI 映射 / 规则建议（v0.5）。
- 报告（HTML / JSON）导出（v0.6）。

### 已知问题
- 浏览器端到端点击（选择文件→预览→映射→校验→规则引擎）已通过单元测试覆盖核心逻辑，真实点击级验证待引入 Playwright 后补齐。
- 规则清单与阈值为首版内置，后续版本将支持自定义规则与配置。

[0.3.0]: https://github.com/hunterwalks/twinflow-studio/releases/tag/v0.3.0

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
