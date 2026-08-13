# TwinFlow Studio

> Local-first、AI-assisted 的数字孪生数据建模与质量治理工作台

TwinFlow Studio 面向数字孪生产品、解决方案、实施和数据人员，帮助在项目早期从 Excel / CSV 资产资料中识别业务对象、建立空间与设备关系、检查数据质量并形成可追溯治理报告。

**当前版本：v0.4.0（骨架 + 合成数据 + 数据预览 + CSV/XLSX 导入 + 确定性校验规则引擎 + 对象关系图与项目保存恢复 + 测试底座）**

- 产品定位与边界见 `02_Context/Project_Context.md` 与 `02_Context/Roadmap_V0.1-V0.6.md`
- 执行交接见根目录 `WORKBUDDY_HY3_HANDOFF.md`
- 本仓库当前只承载 v0.1.0–v0.3.0 范围，不提前实现后续版本功能

## v0.1.0 能力范围

- 应用骨架（Next.js + TypeScript + Tailwind CSS）
- 内置「合成工业园区」Demo 数据（Space / Asset / Sensor 三类对象）
- 对象数量概览与工作表式数据预览
- 空状态与错误状态的可理解提示
- Vitest 单元测试底座（schema 校验、数据完整性、状态机、列推导）
- 确定性校验与 Local-first 设计：无 AI、无后端、无外部依赖仍可运行

## v0.2.0 新增：CSV / XLSX 导入

- 浏览器端选择并导入 `.csv` 与 `.xlsx` / `.xls` 文件，**不落盘、不联网**
- Excel 多工作表列举与切换选择
- 字段映射：将源列映射到 Space / Asset / Sensor 的模型字段，并按表头给出智能默认映射
- 确认后按现有 Zod 模型逐行校验，给出通过计数与带行号的中文错误（如「第 3 行：ID不能为空」）
- 对不支持的格式、空文件、无法解析的文件给出明确中文提示
- 新增依赖：`papaparse`（CSV）、`xlsx`（SheetJS，XLSX）；均为浏览器端库

## v0.3.0 新增：确定性校验规则引擎

- **15 条规则**，覆盖 6 个类别：完整性、唯一性、引用完整性、层级、覆盖度、规范性
- **问题分级**：错误（数据不可用）/ 警告（可用但有治理风险）/ 提示（完整度与覆盖度信息）
- **问题可溯源**：每条问题定位到 表 / 行号 / 记录 ID / 字段，并给出中文描述与修复建议
- **确定性输出**：排序键固定为 级别 → 表 → 行号 → 规则 ID → 字段，同一输入必然同输出
- **假阳性防护**：被引用表为空时，跨表引用类规则自动跳过并标注原因，不产生悬空引用误报
- **纯函数、无 AI、无网络、无持久化**：直接作用于 v0.2.0 导入产物这样的宽松数据集
- 新增 `/validate` 页面：切换「内置 Demo / 含问题样例 / 无根空间样例」，查看分级汇总、规则维度汇总与可筛选问题清单
- `/import` 页面在字段映射校验后追加规则引擎结果区块（并说明跨表规则被跳过）

## v0.4.0 新增：对象关系图、孤立对象与项目保存恢复

- **对象关系图**：基于 React Flow（`@xyflow/react`）在 `/graph` 页面可视化 Space / Asset / Sensor 的层级与引用结构；节点按类型配色、可缩放 / 拖拽 / fit view，点击查看对象详情
- **确定性布局与连线**：按类型分列的稳定布局，生成「父级 / 位于空间 / 挂载设备」三类关系连线
- **孤立 / 悬空对象识别**：高亮悬空引用与层级不可达对象并标注中文原因；被引用表为空时跳过跨表判定，不产生误报
- **项目保存与恢复**：当前数据（Demo 或导入结果）自动写入浏览器 `localStorage`，关闭重开自动恢复；提供「清空项目」入口
- `/demo`、`/import` 在产出数据后写入统一项目状态，`/graph` 可直接读取；首页新增「查看关系图 →」入口

> 后续版本（v0.5–v0.6）将逐步开放 AI 建议与报告导出。

## 快速开始（Windows）

要求：Node.js ≥ 18.18（推荐 20+），npm ≥ 9。

```bash
# 1. 安装依赖
npm install

# 2. 本地启动开发服务
npm run dev
# 打开 http://localhost:3000
#   - 点击「打开 Demo」进入合成工业园区 Demo
#   - 点击「导入数据」进入 CSV / XLSX 导入与字段映射
#   - 点击「校验数据」运行 15 条校验规则引擎并查看分级、可溯源问题清单
#   - 点击「查看关系图」以关系图查看对象层级与引用，孤立对象会被高亮

# 3. 或构建并以生产模式运行
npm run build
npm run start
# 打开 http://localhost:3000
```

## 常用脚本

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动开发服务 |
| `npm run build` | 生产构建 |
| `npm run start` | 以生产模式运行构建结果 |
| `npm run lint` | ESLint 检查（next/core-web-vitals） |
| `npm run typecheck` | TypeScript 类型检查（tsc --noEmit） |
| `npm run test` | 运行 Vitest 单元测试 |

## 目录结构

```
twinflow-studio/
├── src/
│   ├── app/                 # Next.js App Router（首页 / demo / import / validate / graph 页）
│   ├── components/          # UI 组件（数据表、计数、空/错误态、校验汇总/问题清单）
│   ├── lib/
│   │   ├── types.ts         # Zod 领域模型（Space/Asset/Sensor）
│   │   ├── data/            # 合成工业园区 fixture（含问题样例）
│   │   ├── loadDemo.ts      # Demo 加载状态机 + 计数
│   │   ├── table.ts         # 工作表预览列/行派生
│   │   ├── rules/           # v0.3.0 校验规则引擎（纯 TS）
│   │   │   ├── types.ts          # Issue / Rule / 分级 / 类别
│   │   │   ├── dataset.ts        # 宽松数据集与上下文构建
│   │   │   ├── spec.ts           # 字段标签、必填、引用、命名等规范常量
│   │   │   ├── define.ts         # 规则定义工厂
│   │   │   ├── rules/*.ts        # 6 个类别文件承载 15 条规则
│   │   │   ├── registry.ts       # 规则注册表（ALL_RULES）
│   │   │   ├── engine.ts         # runRules / 排序 / 筛选 / 溯源
│   │   │   └── index.ts          # 对外出口
│   │   ├── graph/           # v0.4.0 关系图：types / orphans（孤立识别）/ layout（确定性布局）
│   │   ├── project/         # v0.4.0 项目状态与持久化：types / persist / ProjectProvider
│   │   └── import/          # v0.2.0 导入：解析 / 目标字段 / 映射与校验
│   │       ├── parse.ts          # CSV/XLSX → {sheets, rows}
│   │       ├── fieldTargets.ts   # 目标字段定义与表头别名
│   │       └── mapping.ts        # 表头自动匹配 + 列→记录 + Zod 校验
│   └── test/                # Vitest 单元测试（含 import 与 rules）
├── .gitignore               # 忽略 .env、密钥与构建产物
├── CHANGELOG.md             # 版本变更记录
└── LICENSE                  # MIT
```

## 数据边界与公开性

- 本仓库仅使用合成数据，不含有任何真实客户、个人或敏感信息。
- 仓库不保存 API Key、账号凭据或个人敏感信息。
- 公开仓库只能使用合成数据、脱敏数据和确认可公开的材料。

## 许可

[MIT](./LICENSE)
