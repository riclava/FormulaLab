# FormulaLab V1 Alpha 发布说明

## 发布目标

V1 Alpha 用来验证 FormulaLab 的核心学习闭环是否成立：

```text
首次诊断 -> 今日复习 -> Again/Hard 补弱 -> 记忆钩子 -> 复习总结 -> 下次继续
```

## 已包含能力

- Review First 主入口。
- 邮箱 magic link 登录。
- 登录后跨设备继续同一条训练链路。
- 概率统计 Alpha 公式集。
- 首次诊断和初始薄弱公式识别。
- 今日复习队列。
- Recall / Recognition / Application 三类题。
- Again / Hard / Good / Easy 自评。
- 简单间隔调度。
- Again / Hard 后补弱面板。
- 公式详情页。
- 个人记忆钩子和 AI 候选联想管理。
- 复习总结和基础指标。
- 公式列表辅助入口。
- 内部内容辅助工作台。

## 暂不包含

- 完整的密码登录、社交登录和权限后台体系。
- 完整知识图谱编辑器。
- 多知识域课程体系。
- 用户侧 AI 聊天入口。
- 高级记忆算法或 FSRS。
- 生产级内容审核后台权限。

## Alpha 验收指标

- 新用户能在 1 分钟内完成首次诊断。
- 新用户能完成至少一轮今日复习。
- Again / Hard 之后能完成一次补弱动作。
- 至少一条个人记忆钩子能被创建，并在后续提示中出现。
- `/summary` 能清楚展示下一步该复习什么。

## 发布前命令

```bash
npm run test:all
E2E_BASE_URL=http://localhost:3000 E2E_AUTH_COOKIE="better-auth.session_token=..." npm run test:e2e
```

## Alpha 反馈重点

- 用户是否理解为什么要先复习，而不是先浏览知识库。
- 用户是否愿意在 Again / Hard 后停下来做补弱。
- 记忆钩子是否真的帮助用户再次想起公式。
- 总结页是否让用户知道下一步该做什么。
