# FormulaLab

FormulaLab is a review-first web training tool for formula-based learning. V1 focuses on one high-quality formula domain and validates the learning loop:

```text
Built-in formula set -> Diagnostic -> Today Review -> Feedback -> Memory Hook -> Schedule -> Retention
```

## Phase 0 Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Prisma
- PostgreSQL
- KaTeX

## Getting Started

Install dependencies:

```bash
npm install
```

Copy the example environment file and set `DATABASE_URL`:

```bash
cp .env.example .env
```

Generate the Prisma client:

```bash
npm run prisma:generate
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to `/review` to preserve the Review First product shape.

## Project Documents

- `AGENTS.md`: project-specific instructions for Codex and other coding agents.
- `docs/draft.md`: product strategy and V1 scope.
- `docs/tasks.md`: staged development plan.
- `docs/demo.tsx`: interaction prototype reference, not production code.

## Git 提交格式

+ `feat` 添加了新特性
+ `fix` 修复问题
+ `style` 无逻辑改动的代码风格调整
+ `perf` 性能/优化
+ `refactor` 重构
+ `revert` 回滚提交
+ `test` 测试
+ `docs` 文档
+ `chore` 依赖或者脚手架调整
+ `workflow` 工作流优化
+ `ci` 持续集成
+ `types` 类型定义
+ `wip` 开发中
