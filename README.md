# FormulaLab

FormulaLab 是一个面向“公式型知识学习”的 Review First Web 训练工具。V1 聚焦一个高质量公式知识域，优先验证用户是否能每天完成复习、补弱薄弱公式，并用个人记忆钩子提升回忆效果。

核心学习闭环：

```text
内置公式集 -> 首次诊断 -> 今日复习 -> 反馈 -> 记忆钩子 -> 简单调度 -> 长期保持
```

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Prisma
- PostgreSQL
- KaTeX

## 本地启动

安装依赖：

```bash
npm install
```

复制环境变量示例，并确认 `DATABASE_URL` 指向本地 PostgreSQL：

```bash
cp .env.example .env
```

启动 PostgreSQL：

```bash
docker compose up -d postgres
```

生成 Prisma Client：

```bash
npm run prisma:generate
```

数据库启动后，执行迁移并写入 Alpha 公式种子数据：

```bash
npm run prisma:migrate
npm run db:seed
```

启动开发服务器：

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。根路由会跳转到 `/review`，以保持 Review First 的产品结构。

## 常用命令

```bash
npm run lint
npm run build
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run db:seed
```

## 项目文档

- `AGENTS.md`：给 Codex 和其他 coding agent 的项目工作说明。
- `docs/draft.md`：产品方案、V1 范围、核心流程、领域模型和 API 草案。
- `docs/tasks.md`：多阶段开发计划和验收标准。
- `docs/demo.tsx`：交互原型参考，不作为生产代码或最终视觉规范直接照搬。

## Git 提交格式

- `feat` 添加了新特性
- `fix` 修复问题
- `style` 无逻辑改动的代码风格调整
- `perf` 性能/优化
- `refactor` 重构
- `revert` 回滚提交
- `test` 测试
- `docs` 文档
- `chore` 依赖或者脚手架调整
- `workflow` 工作流优化
- `ci` 持续集成
- `types` 类型定义
- `wip` 开发中
