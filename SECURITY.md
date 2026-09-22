# 安全策略（Security Policy）

TwinFlow Studio 是一个 **local-first** 的浏览器端工作台：没有业务后端、没有账号体系、没有遥测，用户数据不离开浏览器。因此本项目关心的安全面与常规服务端应用不同，主要集中在下述范围。

This project is local-first and browser-only: there is no backend, no account system, and no telemetry. User data never leaves the browser.

## 支持范围（Supported versions）

| 版本 | 是否接受安全修复 |
|---|---|
| 最新 Release（如 `v1.5.2`） | ✅ |
| `main` 分支 | ✅ |
| 更早的 Release | ❌ 建议先升级到最新版 |

## 需要报告的问题（In scope）

- **表格解析安全**：CSV / XLSX 解析导致的崩溃、原型污染、内存耗尽、解析器绕过（含 20 MiB 上限的绕过）。
- **报告导出安全**：导出的自包含 HTML / JSON 报告中出现脚本注入（XSS）或不当内容透传。
- **本地存储安全**：项目数据在 `localStorage` 持久化过程中的越权、数据串扰或静默损坏。
- **隐私边界破坏**：任何导致用户表格内容离开浏览器的行为（新增外部请求、把数据写入第三方服务、引入运行时遥测）。
- **依赖链漏洞**：影响本项目实际运行路径的第三方依赖漏洞。
- **供应链与发布完整性**：发布包被篡改、CI / 发布流程可被越权利用。

## 不在范围内（Out of scope）

- 需要受害者在本机主动执行任意代码、或已完全控制用户浏览器的情况。
- 仅影响本项目不使用的服务端 / 数据库 / 云基础设施的问题（本项目不含这些组件）。
- 缺少可复现步骤的纯理论报告。
- 第三方平台（GitHub Pages、浏览器本体、依赖上游）自身的问题；请直接上报对应上游。

## 如何报告（How to report）

请使用 GitHub 的**私密漏洞报告**功能：<https://github.com/hunterwalks/twinflow-studio/security/advisories/new>

Report privately via GitHub Security Advisories. **请不要**为未修复的安全问题创建公开 Issue。

报告中请尽量包含：

1. 受影响版本与运行环境（浏览器 / 操作系统）；
2. 复现步骤，以及可用的最小合成样例（**不要提交真实客户数据或任何凭据**）；
3. 影响判断与你的验证证据；
4. 如果你有修复建议，也欢迎一并说明。

## 响应方式（What to expect）

本项目由单一维护者利用业余时间维护，响应为**尽力而为**，不构成 SLA：

- 收到报告后会尽快确认收到并评估影响；
- 确认有效后优先在最新版本修复，并在 `CHANGELOG.md` 与 GitHub Release 中说明；
- 如你希望署名，请在报告中说明；否则默认匿名致谢。

## 我们的安全承诺（Maintainer commitments）

- 仓库与发布包中不包含任何真实客户、个人或敏感数据，示例数据全部为合成数据。
- 运行时**不调用**任何外部 AI / 业务 API；引入任何外发行为都视为破坏本项目隐私边界。
- 发布流程、质量门与自动化脚本变更需人工复核；核心校验逻辑（`src/lib/rules/*`）与本地持久化（`src/lib/project/*`）变更需独立 Review。
