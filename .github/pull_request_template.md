## 变更内容 / What changed

<!-- 一到三句话说明这个 PR 做了什么、为什么需要 -->

## 关联 Issue / Related issue

<!-- 例如 Closes #12；无关联 Issue 请说明背景 -->

## 变更类型 / Type of change

- [ ] Bug 修复（向后兼容）
- [ ] 新功能（向后兼容）
- [ ] 破坏性变更（需单独讨论）
- [ ] 文档 / 仓库治理
- [ ] 测试或 CI

## 自测证据 / How it was verified

<!-- 请粘贴实际输出或结果摘要；只写“已测试”不算证据 -->

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run test:e2e`

环境 / Environment：<!-- Node 版本、操作系统、浏览器版本 -->

## 检查清单 / Checklist

- [ ] 影响用户可见行为时，已补充或更新 `e2e/flows.spec.ts`
- [ ] 已在 `CHANGELOG.md` 记录本次变更
- [ ] 未引入后端、上传行为或运行时外部 AI 依赖（保持 local-first）
- [ ] 未提交真实客户数据、凭据、密钥或个人信息
- [ ] 新增校验 / 转换 / 导出逻辑为可测试的确定性纯函数

## AI 辅助声明 / AI assistance

<!-- 见 CONTRIBUTING.md 第 3 节 -->

- [ ] 本 PR 由 AI 辅助完成，已在标题或描述标注 `[GPT-assisted]`
- [ ] 涉及规则引擎 / 项目格式 / 本地存储时，已由维护者或独立 Reviewer 复核
