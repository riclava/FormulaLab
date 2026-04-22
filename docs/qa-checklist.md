# V1 Alpha QA 清单

## 关键路径

- 新用户访问 `/review` 时，如果没有学习状态，应能进入首次诊断。
- 用户能在 `/diagnostic` 完成 3-5 道诊断题并进入 `/review`。
- `/review` 默认只显示题目，点击后才显示提示和答案。
- 显示答案后才能提交 Again / Hard / Good / Easy。
- Again / Hard 后会出现补弱入口，可以查看适用条件、误用点和记忆钩子。
- 用户能创建个人记忆钩子，并在下一次提示时优先看到个人联想。
- 完成一轮复习后，`/summary` 能展示本轮结果、薄弱公式和下一次计划。

## 端到端自动化

本地启动数据库和应用：

```bash
docker compose up -d postgres
npm run prisma:migrate
npm run db:seed
npm run dev
```

另开终端执行：

```bash
E2E_BASE_URL=http://localhost:3000 npm run test:e2e
```

覆盖范围：

- 首次诊断 API。
- 今日复习 API。
- 提示 API。
- Again 提交。
- 稍后再练。
- 复习总结 API。

## 响应式检查

已在 2026-04-22 使用真实浏览器检查以下视口：

- Mobile：390 x 844
- Tablet：768 x 1024
- Desktop：1440 x 900

重点页面：

- `/diagnostic`
- `/review`
- `/formulas`
- `/formulas/bayes-theorem`
- `/memory-hooks`
- `/summary`
- `/content-assist`

检查项：

- [x] 顶部导航不会挤压或遮挡。
- [x] Review 卡片按钮在移动端不会换行到不可点击状态。
- [x] 公式 LaTeX 内容不会造成页面级水平溢出。
- [x] 详情页和总结页的卡片间距在移动端仍可扫描。
- [x] 内容辅助编辑器在移动端可纵向完成编辑和审核。

检查结果：

- 以上 7 个页面在 3 个视口下均未发现页面级水平滚动或可见元素越界。
- 移动端公式详情曾出现 KaTeX 内部元素贴边风险，已为块级公式渲染容器增加 `max-w-full` 和 `overflow-x-auto` 保护。

## 可访问性检查

- [x] 表单输入都有可见 label 或清晰的上下文。
- [x] 主要操作按钮可以用键盘 Tab 到达。
- [x] 焦点态可见。
- [x] 颜色不单独承担状态表达，关键状态有文字说明。
- [x] `button` 和 `a` 的语义符合行为：页面跳转用链接，提交动作用按钮。
- [x] Review 流程不会在显示答案前暴露答案文本。

检查结果：

- 以上 7 个页面在 3 个视口下均未发现缺失表单标签、缺失图片 alt、过小点击目标或控制台错误。
- 每个页面前 8 个 Tab 焦点都能进入可见导航或主要操作区域。

## 发布闸门

- `npm run lint` 通过。
- `npm run test` 通过。
- `npm run build` 通过。
- 已在有数据库环境执行 `npm run test:e2e`。
- 已确认生产 `DATABASE_URL` 配置完成。
- 已执行生产迁移和 seed。
