import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Lightbulb,
  Route,
  Sparkles,
  Target,
} from "lucide-react";

import { PhaseShell } from "@/components/app/phase-shell";
import { WeakFormulaList } from "@/components/summary/weak-formula-list";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getAnonymousUserFromCookies } from "@/server/http/anonymous-user-cookie";
import {
  getProgressStats,
  getSummaryStats,
} from "@/server/services/stats-service";
import type { ProgressStats, SummaryStats } from "@/types/stats";

export const dynamic = "force-dynamic";

export default async function SummaryPage() {
  const { user } = await getAnonymousUserFromCookies();
  const [summary, progress] = await Promise.all([
    getSummaryStats({
      userId: user.id,
    }),
    getProgressStats({
      userId: user.id,
    }),
  ]);
  const latestSession = summary.latestSession;
  const primaryAction = buildPrimaryAction(summary, progress);
  const completionMessage = buildCompletionMessage(summary, progress);

  return (
    <PhaseShell
      activePath="/summary"
      eyebrow="复习总结"
      title="先判断这一轮有没有收住，再决定下一步。"
      description="上面只保留结果和动作。真正影响今天体验的内容优先放前面，长期统计和产品指标放到后面再看。"
    >
      <div className="grid gap-6">
        <section className="rounded-lg border bg-background p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="grid max-w-3xl gap-3">
              <Badge
                variant={primaryAction.priority === "high" ? "destructive" : "secondary"}
                className="w-fit"
              >
                {primaryAction.badge}
              </Badge>
              <h2 className="text-2xl font-semibold">{completionMessage.title}</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {completionMessage.description}
              </p>
            </div>
            <Link href={primaryAction.href} className={buttonVariants()}>
              {primaryAction.label}
              <ArrowRight data-icon="inline-end" />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="rounded-lg border p-5">
              {latestSession ? (
                <div className="grid gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex size-10 items-center justify-center rounded-md bg-muted">
                          <BarChart3 data-icon="inline-start" />
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold">本轮训练结果</h3>
                          <p className="text-sm text-muted-foreground">
                            共完成 {latestSession.reviewCount} 题，用时{" "}
                            {latestSession.durationMinutes} 分钟。
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">
                      平均单题耗时{" "}
                      <span className="font-medium text-foreground">
                        {latestSession.averageResponseTimeMs
                          ? `${Math.round(latestSession.averageResponseTimeMs / 1000)} 秒`
                          : "暂无记录"}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    {(
                      [
                        ["again", "想不起来"],
                        ["hard", "有点吃力"],
                        ["good", "基本记住"],
                        ["easy", "很轻松"],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key} className="rounded-lg border p-4">
                        <p className="text-2xl font-semibold">
                          {latestSession.grades[key]}
                        </p>
                        <p className="text-sm text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  <h3 className="text-lg font-semibold">还没有可总结的复习记录</h3>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    先完成一次首次诊断或今日复习，这里就会开始累积你的薄弱点、下一次计划和联想活动。
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-4">
              <div className="rounded-lg border p-5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 data-icon="inline-start" />
                  <h3 className="font-semibold">下一步只做这一件事</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {primaryAction.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={primaryAction.href} className={buttonVariants({ size: "sm" })}>
                    {primaryAction.label}
                  </Link>
                  {summary.immediateWeakFormulas[0] ? (
                    <Link
                      href={`/formulas/${summary.immediateWeakFormulas[0].slug}?from=summary&focus=anti-patterns`}
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                    >
                      打开最弱一条
                    </Link>
                  ) : null}
                  <Link
                    href="/formulas"
                    className={buttonVariants({ size: "sm", variant: "outline" })}
                  >
                    浏览公式
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <ProgressCard label="已纳入训练公式" value={progress.trackedFormulaCount} />
                <ProgressCard label="当前到期" value={progress.dueNowCount} />
                <ProgressCard label="稳定中" value={progress.stableCount} />
                <ProgressCard label="需要补弱" value={progress.weakCount} />
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="rounded-lg border bg-background p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Target data-icon="inline-start" />
              <h2 className="font-semibold">建议立刻补弱</h2>
            </div>
            <WeakFormulaList formulas={summary.immediateWeakFormulas} />
          </section>

          <section className="rounded-lg border bg-background p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock data-icon="inline-start" />
              <h2 className="font-semibold">下一次计划</h2>
            </div>

            <div className="grid gap-4">
              <div className="rounded-lg border p-4">
                <Badge variant="secondary" className="mb-2">
                  下次建议复习时间
                </Badge>
                <p className="font-medium">
                  {summary.nextSuggestedReviewAt
                    ? formatDateTime(summary.nextSuggestedReviewAt)
                    : "当前没有待安排的下次复习"}
                </p>
              </div>

              <div className="grid gap-3">
                {summary.learningRecommendations.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="grid gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          item.priority === "high"
                            ? "destructive"
                            : item.priority === "medium"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {item.priority === "high"
                          ? "优先"
                          : item.priority === "medium"
                            ? "建议"
                            : "可选"}
                      </Badge>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>

        <details className="rounded-lg border bg-background p-6 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Route data-icon="inline-start" />
              <h2 className="font-semibold">长期统计</h2>
            </div>
            <span className="text-sm text-muted-foreground">展开查看</span>
          </summary>
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <ProgressCard label="总复习题数" value={summary.advancedStats.totalReviews} />
                <ProgressCard
                  label="总正确率"
                  value={
                    summary.advancedStats.correctRate === null
                      ? 0
                      : Math.round(summary.advancedStats.correctRate * 100)
                  }
                  suffix={summary.advancedStats.correctRate === null ? "" : "%"}
                />
                <ProgressCard
                  label="平均耗时"
                  value={
                    summary.advancedStats.averageResponseTimeMs === null
                      ? 0
                      : Math.round(summary.advancedStats.averageResponseTimeMs / 1000)
                  }
                  suffix={
                    summary.advancedStats.averageResponseTimeMs === null ? "" : " 秒"
                  }
                />
              </div>
              {summary.advancedStats.reviewTypeBreakdown.map((item) => (
                <div key={item.type} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.label}</p>
                    <span className="text-sm text-muted-foreground">
                      {item.weakCount}/{item.count} 需要补弱
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width:
                          item.count > 0
                            ? `${Math.round(((item.count - item.weakCount) / item.count) * 100)}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </section>

            <section className="grid gap-3">
              {summary.memoryHookActivity.length > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <Sparkles data-icon="inline-start" />
                    <h3 className="font-semibold">本轮联想活动</h3>
                  </div>
                  {summary.memoryHookActivity.map((activity) => (
                    <div
                      key={`${activity.source}-${activity.id}-${activity.timestamp}`}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={activity.source === "created" ? "secondary" : "outline"}
                        >
                          {activity.source === "created" ? "新创建" : "被使用"}
                        </Badge>
                        <span className="font-medium">{activity.formulaTitle}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6">{activity.content}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDateTime(activity.timestamp)}
                      </p>
                    </div>
                  ))}
                </>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  这一轮还没有新的记忆钩子创建或使用记录。
                </div>
              )}
            </section>
          </div>
        </details>

        <details className="rounded-lg border bg-background p-6 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lightbulb data-icon="inline-start" />
              <h2 className="font-semibold">V1 指标</h2>
            </div>
            <span className="text-sm text-muted-foreground">展开查看</span>
          </summary>
          <div className="mt-5 grid gap-3">
            {summary.metrics.map((metric) => (
              <div key={metric.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{metric.label}</p>
                  <span className="text-sm font-medium">
                    {metric.value === null ? "暂无数据" : `${Math.round(metric.value * 100)}%`}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {metric.description}
                </p>
              </div>
            ))}
          </div>
        </details>
      </div>
    </PhaseShell>
  );
}

function ProgressCard({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold">
        {value}
        {suffix}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function buildPrimaryAction(summary: SummaryStats, progress: ProgressStats) {
  if (!summary.latestSession) {
    if (progress.latestDiagnosticAt) {
      return {
        href: progress.dueNowCount > 0 ? "/review" : "/formulas",
        label: progress.dueNowCount > 0 ? "回到今日复习" : "先浏览公式",
        description:
          progress.dueNowCount > 0
            ? "你已经有训练状态了，先把今天到期的内容做掉。"
            : "还没有完成一轮可总结的训练，可以先挑一条内容熟悉一下。",
        badge: progress.dueNowCount > 0 ? "回到主任务" : "先热启动一下",
        priority: progress.dueNowCount > 0 ? "high" : "medium",
      } as const;
    }

    return {
      href: "/diagnostic",
      label: "开始 1 分钟诊断",
      description: "先生成你的第一份训练单，之后这里才会开始累积真正有意义的总结。",
      badge: "先完成冷启动",
      priority: "high",
    } as const;
  }

  const difficultCount =
    summary.latestSession.grades.again + summary.latestSession.grades.hard;

  if (summary.immediateWeakFormulas.length > 0 && difficultCount > 0) {
    return {
      href: "/review?mode=weak",
      label: "先补弱 1 条",
      description: `这一轮里有 ${summary.immediateWeakFormulas.length} 条公式值得立刻回收，先补最卡的那条最划算。`,
      badge: "先把最弱点补回来",
      priority: "high",
    } as const;
  }

  if (progress.dueNowCount > 0) {
    return {
      href: "/review",
      label: "继续今日复习",
      description: "这轮已经收住了，但今天还有到期内容，继续完成主队列会更连贯。",
      badge: "主任务还在继续",
      priority: "medium",
    } as const;
  }

  if (summary.memoryHookActivity.some((activity) => activity.source === "created")) {
    return {
      href: "/memory-hooks",
      label: "确认默认提示",
      description: "你这轮刚创建过新的联想，花半分钟把最顺手的一条设成默认，下一次提示会更贴身。",
      badge: "顺手收一个尾",
      priority: "medium",
    } as const;
  }

  return {
    href: "/review",
    label: "回到今日复习",
    description: "今天这轮已经可以算完成了。之后如果还想再练，可以直接回到主训练面板。",
    badge: "今天可以停在这里",
    priority: "low",
  } as const;
}

function buildCompletionMessage(summary: SummaryStats, progress: ProgressStats) {
  if (!summary.latestSession) {
    return {
      title: "这里先看结果，再安排下一步。",
      description:
        progress.latestDiagnosticAt
          ? "你已经开始建立训练状态，但还没有一轮完整 session 可以复盘。先完成一次完整复习，这里会更有信息量。"
          : "先完成冷启动诊断，系统才能知道今天该把哪些公式放到你面前。",
    };
  }

  const difficultCount =
    summary.latestSession.grades.again + summary.latestSession.grades.hard;

  if (summary.immediateWeakFormulas.length > 0 && difficultCount > 0) {
    return {
      title: "这一轮主任务完成了，但还有几条值得立刻补弱。",
      description:
        "不用把总结页当报表看。先把最卡的公式拉回熟悉区，今天的训练体验会完整很多。",
    };
  }

  if (progress.dueNowCount > 0) {
    return {
      title: "这一轮收住了，还可以继续今天的主队列。",
      description:
        "如果你现在还有精力，顺着今日复习继续走最省心；如果没有，这里也已经是一个自然停点。",
    };
  }

  return {
    title: "今天这一轮已经收尾，可以安心停在这里。",
    description:
      "弱项没有堆在手里，当前也没有新的到期任务。之后回来时，系统会按下一次计划把内容重新排好。",
  };
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
