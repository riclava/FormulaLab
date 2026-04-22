import Link from "next/link";
import { ArrowRight, BarChart3, CalendarClock, Lightbulb, Route, Target } from "lucide-react";

import { PhaseShell } from "@/components/app/phase-shell";
import { WeakFormulaList } from "@/components/summary/weak-formula-list";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getAnonymousUserFromCookies } from "@/server/http/anonymous-user-cookie";
import {
  getProgressStats,
  getSummaryStats,
} from "@/server/services/stats-service";

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

  return (
    <PhaseShell
      activePath="/summary"
      eyebrow="复习总结"
      title="看清这一轮结果，然后决定下一步。"
      description="优先展示需要补弱的公式、下一次复习时间和本轮自评分布。统计留在后面，行动放在前面。"
    >
      <div className="grid gap-6">
        {summary.latestSession ? (
          <section className="rounded-lg border bg-background p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-10 items-center justify-center rounded-md bg-muted">
                    <BarChart3 data-icon="inline-start" />
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold">本次复习已完成</h2>
                    <p className="text-sm text-muted-foreground">
                      共完成 {summary.latestSession.reviewCount} 题，用时{" "}
                      {summary.latestSession.durationMinutes} 分钟。
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">
                平均单题耗时{" "}
                <span className="font-medium text-foreground">
                  {summary.latestSession.averageResponseTimeMs
                    ? `${Math.round(summary.latestSession.averageResponseTimeMs / 1000)} 秒`
                    : "暂无记录"}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              {(
                [
                  ["again", "Again"],
                  ["hard", "Hard"],
                  ["good", "Good"],
                  ["easy", "Easy"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-2xl font-semibold">
                    {summary.latestSession?.grades[key] ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-lg border bg-background p-6 shadow-sm">
            <h2 className="text-xl font-semibold">还没有可总结的复习记录</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              先完成一次首次诊断或今日复习，这里就会开始累积你的表现、薄弱点和下一次计划。
            </p>
          </section>
        )}

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
                    ? new Intl.DateTimeFormat("zh-CN", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(summary.nextSuggestedReviewAt))
                    : "当前没有待安排的下次复习"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <ProgressCard label="已纳入训练公式" value={progress.trackedFormulaCount} />
                <ProgressCard label="当前到期" value={progress.dueNowCount} />
                <ProgressCard label="稳定中" value={progress.stableCount} />
                <ProgressCard label="需要补弱" value={progress.weakCount} />
              </div>

              <Link href="/review" className={buttonVariants()}>
                回到今日复习
                <ArrowRight data-icon="inline-end" />
              </Link>
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="rounded-lg border bg-background p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Route data-icon="inline-start" />
              <h2 className="font-semibold">个性化下一步</h2>
            </div>
            <div className="grid gap-3">
              {summary.learningRecommendations.map((item) => (
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
          </section>

          <section className="rounded-lg border bg-background p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 data-icon="inline-start" />
              <h2 className="font-semibold">长期统计</h2>
            </div>
            <div className="grid gap-3">
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
                  suffix={summary.advancedStats.averageResponseTimeMs === null ? "" : " 秒"}
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
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="rounded-lg border bg-background p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb data-icon="inline-start" />
              <h2 className="font-semibold">本轮联想活动</h2>
            </div>
            <div className="grid gap-3">
              {summary.memoryHookActivity.length > 0 ? (
                summary.memoryHookActivity.map((activity) => (
                  <div key={`${activity.source}-${activity.id}-${activity.timestamp}`} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={activity.source === "created" ? "secondary" : "outline"}>
                        {activity.source === "created" ? "新创建" : "被使用"}
                      </Badge>
                      <span className="font-medium">{activity.formulaTitle}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6">{activity.content}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("zh-CN", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(activity.timestamp))}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  这一轮还没有新的记忆钩子创建或使用记录。
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border bg-background p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 data-icon="inline-start" />
              <h2 className="font-semibold">V1 指标</h2>
            </div>
            <div className="grid gap-3">
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
          </section>
        </div>
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
