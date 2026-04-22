# FormulaLab Web V1 产品方案

## 1. 产品定位

FormulaLab 是一个面向“公式型知识学习”的 Web 训练工具，帮助用户围绕公式完成记忆、理解、判断和应用。

V1 的定位应从“公式知识库平台”调整为：

> 一个让用户每天真正记住并会用公式的复习工具。

第一版的重点不是功能完整，而是学习闭环足够强：

```text
内置高质量公式集 -> 首次诊断 -> 今日复习 -> 公式详情补弱 -> 创建记忆钩子 -> 简单调度 -> 复习总结
```

核心闭环：

```text
Content -> Diagnose -> Review -> Feedback -> Memory Hook -> Schedule -> Retention
```

## 2. V1 设计原则

### 2.1 Review First

用户打开产品后的第一屏应优先进入“今日复习”，而不是先进入 Dashboard。

原因：

- V1 最需要验证的是用户是否愿意完成训练。
- 复习行为比浏览统计更接近核心价值。
- 用户每天回来时，最重要的问题是“今天该练什么”。

Dashboard 可以保留为复习结束后的总结页，而不是主入口。

### 2.2 聚焦单一高质量知识域

V1 不应一开始支持所有数学、物理、统计和计算机公式。第一版应只选择一个垂直知识域，并内置一套精选公式。

候选方向：

- 高中物理核心公式。
- 概率统计常用公式。
- 微积分基础公式。
- 机器学习常用公式。

V1 成败更多取决于题目和解释质量，而不是公式覆盖数量。

### 2.3 强化训练感，弱化平台感

V1 应避免做成“大而全学习平台”。优先级更高的是：

- 每天打开就知道练什么。
- 每道题都能触发主动回忆。
- 错误后能快速看到薄弱原因。
- 下次复习时间能被自动安排。

### 2.4 AI 先服务内容生产

AI 在 V1 中更适合做后台辅助，而不是用户侧主入口。

优先用于：

- 生成公式解释。
- 生成 Review 题目。
- 生成常见误用点。
- 生成应用场景。
- 推荐联想记忆候选。

用户侧感受到的应该是“题好、反馈准、复习顺”，而不是“有一个 AI 按钮”。

### 2.5 用记忆钩子连接用户已有经验

公式学习不只是理解新知识，还需要把新公式挂到用户已有的记忆网络里。

V1 应加入 Memory Hook，也就是“记忆钩子”：

- AI 推荐联想：系统根据公式生成可选联想。
- 用户引导联想：系统引导用户写下自己的联想。

联想记忆的目标不是替代准确理解，而是帮助用户更快想起公式。界面上应明确区分：

```text
公式含义 / 使用条件 / 记忆联想
```

## 3. V1 成功指标

V1 不应主要用页面数量、公式数量衡量成功，而应关注训练效果。

建议指标：

| 指标 | 说明 |
| --- | --- |
| 首次 Review 完成率 | 用户首次进入后是否完成一组训练 |
| 次日回访率 | 用户第二天是否回来继续复习 |
| 每日 Review 完成率 | 今日任务是否被完成 |
| Again/Hard 回收率 | 错误和困难公式是否被后续复习拉回 |
| 单次复习耗时 | 每组训练是否足够轻量 |
| 薄弱公式点击率 | 用户是否愿意进入详情页补弱 |
| 记忆钩子创建率 | Again/Hard 后用户是否愿意创建或保存联想 |
| 联想提示有效率 | 用户使用联想提示后是否能完成回忆 |

## 4. V1 范围

V1 建议聚焦 6 个核心体验，而不是 4 个平铺页面。

| 体验 | 核心用途 | 说明 |
| --- | --- | --- |
| 首次诊断 | 快速判断用户薄弱点 | 通过 3-5 道题生成初始复习任务 |
| 今日复习 | 主入口和核心训练场景 | 承载 Recall、Recognition、Application |
| 公式详情 | 错误后的补弱页面 | 解释公式、适用条件、误用和例题 |
| 联想记忆 | 连接用户已有经验 | AI 推荐联想，用户保存、编辑或自建联想 |
| 复习总结 | 替代传统 Dashboard 首屏 | 展示本次表现、薄弱公式和下次计划 |
| 公式列表 | 作为辅助浏览入口 | 用于查找和回看，不作为主流程 |

### 4.1 V1 不做

MVP 阶段暂不优先投入：

- 独立复杂 Knowledge Graph 页面。
- 完整课程体系。
- 用户自建大规模公式库。
- 复杂公式图谱编辑器。
- 复杂联想网络编辑器。
- 自研高级记忆算法。
- AI 个性化学习路径。
- 多端同步和移动端完整功能。

## 5. 页面与流程设计

### 5.1 首次诊断

首次诊断用于降低用户冷启动成本。

流程：

1. 用户选择一个知识域或使用默认知识域。
2. 系统给出 3-5 道代表性小题。
3. 用户完成作答或自评。
4. 系统生成初始薄弱公式和今日复习任务。

诊断题不追求覆盖全部内容，只需要快速把用户带入训练状态。

### 5.2 今日复习

今日复习是 V1 主入口。

单次 Review 流程：

1. 展示题目或提示。
2. 用户先思考，默认不直接显示答案。
3. 用户点击“显示答案”。
4. 用户进行自评。
5. 系统更新公式状态和下一次复习时间。

自评选项：

- Again
- Hard
- Good
- Easy

今日复习页建议展示：

- 当前题目。
- 题型标识。
- 进度计数。
- 显示答案按钮。
- 自评按钮。
- 想不起来时的分级提示入口。
- 错误后进入公式详情的入口。

分级提示顺序：

```text
先主动回忆
-> 想不起来时显示个人联想提示
-> 仍想不起来再显示完整答案
```

联想提示不能默认提前展示，否则会削弱主动回忆效果。

### 5.3 公式详情

公式详情页应围绕“会用”重排，而不是只做知识解释。

推荐结构：

```text
公式
一句话用途
变量说明
什么时候用
什么时候不能用
典型题型
常见误用
记忆联想
例题
关联公式
推导过程
```

其中“什么时候用”和“什么时候不能用”应放在推导之前，因为它们直接影响应用判断。

“记忆联想”应放在常见误用之后，用于帮助用户把公式连接到已有经验，但不能替代使用条件和例题。

### 5.4 复习总结

复习结束后展示总结，而不是在首页优先展示 Dashboard。

推荐内容：

- 本次完成题数。
- Again/Hard/Good/Easy 分布。
- 今日最薄弱公式。
- 下一次建议复习时间。
- 可以立即补弱的公式列表。
- 新创建或被使用的记忆钩子。

### 5.5 联想记忆

联想记忆用于帮助用户把公式挂到自己的已有知识、经验、图像或语言习惯上。

V1 支持两种来源。

#### 5.5.1 AI 推荐联想

AI 根据公式内容生成 2-3 个候选联想，用户可以选择、编辑或丢弃。

推荐联想类型：

| 类型 | 说明 | 示例方向 |
| --- | --- | --- |
| 类比联想 | 用熟悉概念类比公式结构 | “像把整体概率拆成几条路径再加总” |
| 场景联想 | 绑定常见应用场景 | “看到条件概率反推原因时想到它” |
| 图像联想 | 用画面帮助记忆结构 | “树状分支汇总到一个结果” |
| 口诀联想 | 压缩成短句 | “先验乘似然，再除总证据” |
| 对比联想 | 和易混淆公式形成区分 | “它是反推原因，不是直接求交集” |

AI 推荐不能直接替用户决定最终联想。V1 交互应让用户做一次主动选择或编辑，让联想变成“自己的记忆”。

#### 5.5.2 用户引导联想

当用户选择 Again 或 Hard 后，系统可以用轻量问题引导用户创建个人联想：

```text
你可以把这个公式联想到什么？
它像哪个你已经熟悉的公式？
它通常出现在什么题型里？
有没有一个画面、口诀或生活场景能帮你想起它？
```

用户写下来的内容会成为个人记忆钩子，后续复习时可以作为提示出现。

推荐流程：

```text
答错或困难
-> 查看答案
-> 查看公式解释
-> 选择 AI 联想或创建个人联想
-> 保存为下次复习提示
```

### 5.6 轻量公式关联

V1 不单独做复杂 Knowledge Graph 页面。公式关系先放在公式详情页的轻量关联区：

- 前置公式。
- 易混淆公式。
- 常见应用场景。
- 后续应用公式。

这样能保留学习价值，同时减少实现成本。

## 6. 技术架构

### 6.1 推荐技术栈

V1 推荐采用前后端一体架构：

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- PostgreSQL
- KaTeX
- Vercel

选择原因：

- 开发效率高。
- 前后端一体，部署简单。
- 适合小团队快速迭代。
- 后续接入 AI 能力方便。

### 6.2 后续演进

如果后续需要更复杂的服务拆分，可以演进为前后端分离架构：

- 前端：Next.js。
- 后端：NestJS 或 Fastify。
- 数据库：PostgreSQL。
- 缓存和队列：Redis。
- AI 服务：独立服务或独立模块。

适用场景：

- AI 题目生成逻辑复杂。
- 多端复用 API。
- 需要异步队列处理大批量内容生成。
- 团队规模扩大。

## 7. 系统模块

V1 模块建议：

```text
Web App
├── Auth & User
├── Formula Content
├── Diagnostic
├── Review Engine
├── Memory Engine
├── Memory Hook
├── Analytics
└── AI Content Assist
```

### 7.1 Auth & User

负责用户身份、登录状态和用户级配置。

### 7.2 Formula Content

负责公式内容的创建、编辑、查询和组织。

V1 重点应放在内置精选内容，而不是用户侧复杂 CRUD。

### 7.3 Diagnostic

负责首次诊断题目、诊断结果和初始复习计划。

### 7.4 Review Engine

负责生成复习任务、提交复习结果、更新复习状态。

### 7.5 Memory Engine

负责维护用户对每个公式的记忆状态，包括强度、稳定性、难度估计和下一次复习时间。

### 7.6 Memory Hook

负责管理用户的个人联想记忆，包括 AI 推荐联想、用户自建联想、联想提示使用记录和有效性反馈。

### 7.7 Analytics

负责复习总结、薄弱项识别和进度展示。

### 7.8 AI Content Assist

负责辅助生成解释、题目、误用点、应用场景和联想候选。

## 8. 核心领域模型

### 8.1 Formula

公式内容主体。

```ts
type Formula = {
  id: string
  title: string
  expressionLatex: string
  domain: string
  subdomain?: string

  oneLineUse: string
  meaning: string
  intuition?: string
  derivation?: string

  variables: FormulaVariable[]
  useConditions: string[]
  antiPatterns: string[]
  typicalProblems: string[]
  defaultMemoryHooks?: FormulaMemoryHook[]
  examples: string[]

  difficulty: number
  tags: string[]

  createdAt: string
  updatedAt: string
}
```

### 8.2 FormulaVariable

公式变量说明。

```ts
type FormulaVariable = {
  symbol: string
  name: string
  description: string
  unit?: string
}
```

### 8.3 FormulaRelation

公式之间的关系。

```ts
type FormulaRelation = {
  id: string
  fromFormulaId: string
  toFormulaId: string
  relationType:
    | "prerequisite"
    | "related"
    | "confusable"
    | "application_of"
}
```

### 8.4 ReviewItem

一个公式可以对应多种训练题型。V1 启用 Recall、Recognition 和 Application，Derivation 留到后续版本。

```ts
type ReviewItem = {
  id: string
  formulaId: string
  type: "recall" | "recognition" | "application"
  prompt: string
  answer: string
  explanation?: string
  difficulty: number
}
```

### 8.5 UserFormulaState

记录用户和公式之间的学习状态。

```ts
type UserFormulaState = {
  id: string
  userId: string
  formulaId: string

  memoryStrength: number
  stability: number
  difficultyEstimate: number

  lastReviewedAt?: string
  nextReviewAt?: string

  totalReviews: number
  correctReviews: number
  lapseCount: number
  consecutiveCorrect: number
}
```

### 8.6 ReviewLog

记录每一次复习行为。

```ts
type ReviewLog = {
  id: string
  userId: string
  formulaId: string
  reviewItemId: string

  result: "easy" | "good" | "hard" | "again"
  responseTimeMs?: number
  confidence?: number
  memoryHookUsedId?: string

  reviewedAt: string
}
```

### 8.7 DiagnosticAttempt

记录首次诊断结果。

```ts
type DiagnosticAttempt = {
  id: string
  userId: string
  domain: string
  reviewItemIds: string[]
  weakFormulaIds: string[]
  completedAt: string
}
```

### 8.8 FormulaMemoryHook

记录用户和公式之间的个人记忆钩子。

```ts
type FormulaMemoryHook = {
  id: string
  userId: string
  formulaId: string

  source: "ai_suggested" | "user_created"
  type:
    | "analogy"
    | "scenario"
    | "visual"
    | "mnemonic"
    | "contrast"
    | "personal"

  content: string
  prompt?: string

  usedCount: number
  helpfulCount: number
  lastUsedAt?: string

  createdAt: string
  updatedAt: string
}
```

## 9. 学习与复习引擎

### 9.1 V1 训练类型

V1 固定 3 类训练：

| 类型 | 说明 | 示例 |
| --- | --- | --- |
| Recall | 给标题或场景，让用户回忆公式 | “写出贝叶斯公式” |
| Recognition | 给题目，让用户判断应该使用哪个公式 | “这个条件概率问题应使用什么公式？” |
| Application | 给一道题，要求真正使用公式 | “根据题目条件计算结果” |

Derivation 推导填空有价值，但内容成本和实现复杂度更高，建议放到 V1.5 或 Phase 2。

### 9.2 V1 训练占比

建议比例：

| 类型 | 占比 |
| --- | --- |
| Recall | 45% |
| Recognition | 35% |
| Application | 20% |

V1 优先打稳“记住公式”和“知道何时使用公式”。

### 9.3 调度逻辑

V1 不建议一开始实现复杂 FSRS 或自研算法，可以先使用固定间隔规则：

```text
again -> 10 分钟后
hard  -> 1 天后
good  -> 3 天后
easy  -> 7 天后
```

再根据连续正确次数增加间隔：

```text
连续正确 1 次 -> ×1
连续正确 3 次 -> ×2
连续正确 5 次 -> ×3
```

后续可以在数据积累后升级为更强的记忆模型。

### 9.4 错误后的补弱机制

当用户选择 Again 或 Hard 时，系统应提供明确补弱入口：

- 查看公式详情。
- 查看适用条件。
- 查看常见误用。
- 创建或选择记忆钩子。
- 加入今日稍后再练。

这比单纯记录错误更能提升 V1 的学习效果。

### 9.5 联想记忆机制

记忆钩子应服务于主动回忆，而不是提前泄露答案。

使用规则：

- Review 开始时不默认展示联想。
- 用户卡住时可以点击“给我一点提示”。
- 优先展示用户自己创建或保存过的联想。
- 没有个人联想时，可以展示 AI 推荐联想候选。
- 用户使用联想后仍需要自评 Again、Hard、Good 或 Easy。

联想提示使用后，应记录：

- 使用了哪个记忆钩子。
- 使用后用户是否答对或选择了更高评分。
- 用户是否标记“有帮助”。

这些数据可用于后续排序，把最贴合用户记忆习惯的联想放在前面。

## 10. 数据库表

PostgreSQL 表建议：

- `users`
- `formulas`
- `formula_variables`
- `formula_relations`
- `review_items`
- `user_formula_states`
- `review_logs`
- `formula_memory_hooks`
- `diagnostic_attempts`
- `study_sessions`

如果后续支持知识集或课程，再增加：

- `collections`
- `collection_formulas`

## 11. API 设计

### 11.1 内容相关

```http
GET /api/formulas
GET /api/formulas/:id
GET /api/formulas/:id/relations
```

### 11.2 联想记忆相关

```http
GET /api/formulas/:id/memory-hooks
POST /api/formulas/:id/memory-hooks
POST /api/formulas/:id/memory-hooks/suggest
POST /api/memory-hooks/:id/helpful
```

### 11.3 诊断相关

```http
GET /api/diagnostic/start
POST /api/diagnostic/submit
GET /api/diagnostic/result
```

### 11.4 训练相关

```http
GET /api/review/today
POST /api/review/submit
POST /api/review/defer
POST /api/review/hint
GET /api/review/session/:id
```

### 11.5 统计相关

```http
GET /api/stats/summary
GET /api/stats/progress
GET /api/stats/weak-formulas
```

## 12. 前端组件

关键组件建议：

- `DiagnosticQuiz`
- `ReviewCard`
- `SelfAssessmentButtons`
- `FormulaDetailPanel`
- `LatexRenderer`
- `FormulaUseCases`
- `MemoryHookPrompt`
- `MemoryHookSuggestions`
- `WeakFormulaList`
- `ReviewSummary`
- `FormulaCard`

Knowledge Graph 相关组件不进入 V1 主路径，可以后续再做。

## 13. AI 能力规划

AI 在 V1 中先用于内容生产和内部辅助。

### 13.1 自动生成解释

将公式转成：

- 一句话用途。
- 变量解释。
- 适用条件。
- 易错点。

### 13.2 自动生成题目

生成训练内容：

- Recall prompt。
- Recognition 选择题。
- Application 小题。

### 13.3 自动生成关联

识别公式关系：

- 哪些公式是前置依赖。
- 哪些公式容易混淆。
- 哪些公式属于同一应用链路。

### 13.4 自动生成联想候选

生成 2-3 个记忆联想候选：

- 类比联想。
- 场景联想。
- 图像联想。
- 口诀联想。
- 易混淆对比。

AI 生成的联想需要经过用户选择或编辑后，才保存为个人记忆钩子。

### 13.5 V1 用户侧不做 AI 主入口

V1 暂不把 AI 做成核心按钮或对话入口，避免用户体验从“训练”偏移到“聊天”。

## 14. 开发路线

### Phase 1：V1 效果优先版本

- 内置一个高质量公式集。
- 首次诊断。
- 今日复习主入口。
- Recall、Recognition、Application 三类题。
- 公式详情补弱页。
- AI 推荐联想和用户引导联想。
- 简单间隔复习调度。
- 复习总结页。

### Phase 2：可持续学习

- 更完整的统计面板。
- 错题重练。
- 轻量公式关系增强。
- 用户自定义公式。
- Derivation 推导训练。

### Phase 3：AI 增强

- 自动出题。
- 自动解释。
- 自动识别薄弱点。
- 个性化学习路径。
- 更智能的记忆模型。

## 15. 目录结构建议

```text
src/
  app/
    diagnostic/
    review/
    formulas/
    memory-hooks/
    summary/
    api/
  components/
    diagnostic/
    formula/
    memory-hook/
    review/
    stats/
    ui/
  lib/
    db/
    diagnostic/
    review/
    memory-hook/
    formula/
    analytics/
    ai/
  server/
    services/
    repositories/
  types/
```

## 16. V1 最小落地版本

如果要让第一个版本效果最好，最优先完成：

```text
内置高质量公式集 + 首次诊断 + 今日复习 + 错误补弱 + 个人联想 + 简单调度
```

最值得优先投入的 5 件事：

1. 高质量公式内容模型。
2. 三类核心 Review 题目。
3. Review First 的交互体验。
4. Again/Hard 后的补弱闭环。
5. 贴合用户已有经验的记忆钩子。

V1 先砍掉平台感，集中验证训练效果。只要用户每天愿意回来完成复习，能从错误中看到明确薄弱点，并能把新公式接到自己的旧记忆上，FormulaLab 的核心价值就成立。
