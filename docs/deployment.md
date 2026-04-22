# 部署说明

FormulaLab V1 Alpha 推荐部署到 Vercel，数据库使用任意兼容 PostgreSQL 的托管服务。

## 必需环境变量

- `DATABASE_URL`：PostgreSQL 连接串，Prisma 和应用 API 都依赖它。
- `NEXT_PUBLIC_APP_URL`：生产站点 URL，例如 `https://formulalab.example.com`。

## Vercel 配置

仓库根目录已包含 `vercel.json`，指定：

- Framework：Next.js
- Install Command：`npm install`
- Build Command：`npm run build`

部署前在 Vercel Project Settings 中配置 `DATABASE_URL` 和 `NEXT_PUBLIC_APP_URL`。

## 数据库上线步骤

1. 创建生产 PostgreSQL 数据库。
2. 在 Vercel 配置 `DATABASE_URL`。
3. 本地或 CI 执行迁移：

```bash
npm run prisma:migrate
```

4. 写入 Alpha 种子内容：

```bash
npm run db:seed
```

`db:seed` 会读取 `content-assist/approved` 下的已审核内容辅助包，并合并到正式种子数据。

## 发布前检查

```bash
npm run test:all
npm run test:e2e
```

`test:e2e` 需要先启动服务并设置：

```bash
E2E_BASE_URL=http://localhost:3000 npm run test:e2e
```

如果没有设置 `E2E_BASE_URL`，端到端测试会自动跳过。
