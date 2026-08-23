# 贡献指南（Contributing Guide）

感谢你关注 **TwinFlow Studio**！这是一个 local-first、AI-assisted 的数字孪生数据建模与质量治理工作台。本文件说明如何参与贡献，包括 AI / GPT 辅助贡献的政策。

## 1. 项目定位

- 面向数字孪生项目早期的数据建模与质量治理；
- 核心链路 **local-first**：解析、校验、报告均在浏览器内完成，默认不上传业务数据；
- 模型、规则、适配器与报告可扩展；AI 只产生带证据与置信度的候选建议，关键动作需人工确认；
- 无外部 AI / 后端依赖也可完整运行。

## 2. 行为准则

- 友善、就事论事；讨论聚焦产品范围与技术实现；
- 提交前请自测，避免把未通过质量门的代码推送给维护者；
- 不提交任何 API Key、账号凭据或个人敏感信息；
- 不使用真实客户或公司的项目原始数据作为仓库样例。

## 3. AI / GPT 辅助贡献政策

**本仓库允许并使用 GPT 类工具（如 ChatGPT、Copilot、其他大模型）辅助贡献**，但遵循以下边界：

1. **允许**：用 GPT 辅助生成代码草稿、单元测试、文档初稿、Issue/PR 描述、重构建议；
2. **必须自证**：任何由 AI 辅助产出的 PR，都须在 PR 描述中说明"变更内容 + 自测证据"——
   至少包含 `npm run typecheck`、`npm run lint`、`npm run test` 的通过结果；
3. **核心引擎人工复核**：涉及校验规则引擎（`src/lib/rules/*`）、项目格式与迁移（`src/lib/project/*`）、
   数据安全与本地存储（`src/lib/project/persist.ts`、`StorageBanner`）的变更，**不得仅由 AI 代写后直接合并**，
   须由维护者或独立 Reviewer 复核语义正确性与回归影响；
4. **确定性优先**：新增校验/转换/导出逻辑必须是可测试的纯函数，输出确定性可复现；
   禁止引入"模型随机性"破坏既有测试；
5. **不引入运行时 GPT 依赖**：仓库运行时不调用任何外部 GPT/AI API；AI 仅用于开发协作，不进入产品运行时；
6. **透明声明**：如 PR 主要由 GPT 生成，请在标题或描述标注 `[GPT-assisted]`，便于复核。

> 维护者同样使用 AI 辅助进行高密度实现（如 v0.7—v1.x 的可用性硬化），但每个正式版本均由人工把关验收与发布。

## 4. 如何提交 Issue / PR

- **Issue**：描述"预期 / 实际 / 复现步骤"，如涉及数据问题请使用合成数据或脱敏片段；
- **PR**：
  1. 从 `main` 切出特性分支（`feat/xxx`、`fix/xxx`）；
  2. 遵循 SemVer：向后兼容的功能增量走小版本，破坏性变更走大版本并单独讨论；
  3. 更新 `CHANGELOG.md`（Added / Changed / Fixed / Quality 四类）；
  4. 如影响用户可见行为，补充或更新 E2E（`e2e/flows.spec.ts`）；
  5. 本地运行质量门全绿后再提交。

## 5. 本地运行（约 5 分钟）

```bash
npm install
npm run dev        # 启动开发服务器（默认 http://localhost:3000）
npm run typecheck  # 类型检查
npm run lint       # ESLint（Flat Config）
npm run test       # Vitest 单元测试
npm run build      # 生产构建
npm run test:e2e   # Playwright 端到端（需先 build 或 dev 运行）
```

## 6. 版本与发布

- 版本号遵循 [SemVer](https://semver.org/)；当前主线为 `v1.x` 可用性硬化与行业适配；
- 每个正式版本具备：独立 Task、范围/非目标/验收、质量门、CHANGELOG、Run Record、截图、Git Tag 与 GitHub Release；
- 推送、Tag 与 Release 由维护者按当次授权执行。

再次感谢你的参与！
