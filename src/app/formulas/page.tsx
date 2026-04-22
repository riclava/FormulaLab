import Link from "next/link";
import { ArrowRight, Clock3, Filter, Search, Sparkles } from "lucide-react";

import { PhaseShell } from "@/components/app/phase-shell";
import { LatexRenderer } from "@/components/formula/latex-renderer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAnonymousUserFromCookies } from "@/server/http/anonymous-user-cookie";
import { getFormulaCatalog } from "@/server/services/formula-service";
import type { FormulaSummary } from "@/types/formula";

export const dynamic = "force-dynamic";

const STATUS_BADGE_VARIANTS: Record<
  FormulaSummary["trainingStatus"],
  "secondary" | "outline" | "destructive"
> = {
  not_started: "outline",
  weak: "destructive",
  due_now: "secondary",
  learning: "secondary",
  scheduled: "outline",
  stable: "secondary",
};

export default async function FormulasPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    domain?: string;
    tag?: string;
    difficulty?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const domain = params.domain?.trim() || undefined;
  const tag = params.tag?.trim() || undefined;
  const difficulty = parseDifficulty(params.difficulty);
  const { user } = await getAnonymousUserFromCookies();
  const catalog = await getFormulaCatalog({
    query: query || undefined,
    domain,
    tag,
    difficulty,
    userId: user.id,
  });
  const resultSummary = buildResultSummary(catalog.formulas);
  const buildHref = createFormulaCatalogHrefBuilder({
    q: query || null,
    domain: domain ?? null,
    tag: tag ?? null,
    difficulty: difficulty ?? null,
  });

  return (
    <PhaseShell
      activePath="/formulas"
      eyebrow="公式列表"
      title="先快速定位，再回到训练。"
      description="这里不是让你慢慢逛目录的地方。更适合快速确认某条公式什么时候用、哪里容易错，然后回到刚才的训练链路。"
    >
      <section className="grid gap-5 rounded-lg border bg-background p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <form action="/formulas" className="grid w-full gap-3 lg:max-w-2xl">
            <div className="grid gap-2">
              <Label htmlFor="formula-search">搜索公式</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="formula-search"
                  name="q"
                  type="search"
                  defaultValue={query}
                  placeholder="搜索标题、变量、关键词"
                  className="h-9"
                />
                {domain ? <input type="hidden" name="domain" value={domain} /> : null}
                {tag ? <input type="hidden" name="tag" value={tag} /> : null}
                {difficulty !== undefined ? (
                  <input type="hidden" name="difficulty" value={difficulty} />
                ) : null}
                <button type="submit" className={buttonVariants({ size: "lg" })}>
                  <Search data-icon="inline-start" />
                  搜索
                </button>
              </div>
            </div>
          </form>

          <div className="grid gap-2 text-sm text-muted-foreground">
            <p>
              共找到 <span className="font-medium text-foreground">{catalog.formulas.length}</span>{" "}
              条公式，当前重点是{" "}
              <span className="font-medium text-foreground">
                {resultSummary.weakCount + resultSummary.dueCount}
              </span>{" "}
              条需要尽快处理的内容。
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/review" className={buttonVariants({ size: "sm" })}>
                回到今日复习
                <ArrowRight data-icon="inline-end" />
              </Link>
              {resultSummary.weakCount > 0 ? (
                <Link
                  href="/review?mode=weak"
                  className={buttonVariants({ size: "sm", variant: "secondary" })}
                >
                  先补弱项
                </Link>
              ) : null}
              <Link
                href={buildHref({
                  q: null,
                  domain: null,
                  tag: null,
                  difficulty: null,
                })}
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                清空筛选
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t pt-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter data-icon="inline-start" />
            <span>筛选条件</span>
          </div>

          <FilterRow
            label="知识域"
            items={[
              {
                label: "全部",
                href: buildHref({ domain: null }),
                active: !domain,
              },
              ...catalog.filters.domains.map((item) => ({
                label: item,
                href: buildHref({ domain: item }),
                active: domain === item,
              })),
            ]}
          />

          <FilterRow
            label="难度"
            items={[
              {
                label: "全部",
                href: buildHref({ difficulty: null }),
                active: difficulty === undefined,
              },
              ...catalog.filters.difficulties.map((item) => ({
                label: `难度 ${item}`,
                href: buildHref({ difficulty: item }),
                active: difficulty === item,
              })),
            ]}
          />

          <FilterRow
            label="标签"
            items={[
              {
                label: "全部",
                href: buildHref({ tag: null }),
                active: !tag,
              },
              ...catalog.filters.tags.slice(0, 10).map((item) => ({
                label: item,
                href: buildHref({ tag: item }),
                active: tag === item,
              })),
            ]}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="需要补弱" value={resultSummary.weakCount} tone="destructive" />
        <StatCard label="今天到期" value={resultSummary.dueCount} tone="secondary" />
        <StatCard label="已有个人联想" value={resultSummary.hookedCount} />
        <StatCard label="稳定中" value={resultSummary.stableCount} />
      </section>

      <section className="grid gap-4">
        {catalog.formulas.length > 0 ? (
          catalog.formulas.map((formula) => (
            <article
              key={formula.id}
              className="grid gap-4 rounded-lg border bg-background p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold">{formula.title}</h2>
                    <Badge variant={STATUS_BADGE_VARIANTS[formula.trainingStatus]}>
                      {formula.trainingStatusLabel}
                    </Badge>
                    <Badge variant="outline">{formula.domain}</Badge>
                    {formula.hasPersonalMemoryHook ? (
                      <Badge variant="secondary">
                        <Sparkles data-icon="inline-start" />
                        已有个人联想
                      </Badge>
                    ) : null}
                    {formula.isWeak ? (
                      <Badge variant="destructive">优先补弱</Badge>
                    ) : null}
                  </div>

                  <LatexRenderer expression={formula.expressionLatex} />

                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    {formula.oneLineUse}
                  </p>
                </div>

                <div className="grid gap-2 rounded-lg border px-4 py-3 text-sm text-muted-foreground lg:min-w-60">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Clock3 data-icon="inline-start" />
                    <span>下次复习</span>
                  </div>
                  <p>{formatNextReviewAt(formula.nextReviewAt)}</p>
                  <p>
                    {formula.totalReviews > 0
                      ? `正确 ${formula.correctReviews}/${formula.totalReviews} 次`
                      : "还没有训练记录"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">难度 {formula.difficulty}</Badge>
                {formula.tags.slice(0, 4).map((item) => (
                  <Badge key={item} variant="outline">
                    {item}
                  </Badge>
                ))}
                {formula.tags.length > 4 ? (
                  <Badge variant="outline">+{formula.tags.length - 4}</Badge>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground">
                <div className="flex flex-wrap gap-4">
                  <span>变量：{formatVariablePreview(formula)}</span>
                  <span>训练题：{formula.reviewItemCount}</span>
                  <span>可用联想：{formula.memoryHookCount}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/formulas/${formula.slug}?from=formulas`}
                    className={buttonVariants({ size: "sm", variant: "outline" })}
                  >
                    查看详情
                  </Link>
                  {formula.isWeak ? (
                    <Link
                      href={`/formulas/${formula.slug}?from=formulas&focus=anti-patterns`}
                      className={buttonVariants({ size: "sm" })}
                    >
                      继续补弱
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-dashed bg-background p-8 text-sm text-muted-foreground">
            当前筛选下还没有匹配结果。可以放宽标签或难度条件，或者直接返回今日复习继续训练。
          </div>
        )}
      </section>
    </PhaseShell>
  );
}

function FilterRow({
  label,
  items,
}: {
  label: string;
  items: Array<{
    label: string;
    href: string;
    active: boolean;
  }>;
}) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={`${label}-${item.label}`}
            href={item.href}
            className={buttonVariants({
              size: "sm",
              variant: item.active ? "default" : "outline",
            })}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "outline",
}: {
  label: string;
  value: number;
  tone?: "outline" | "secondary" | "destructive";
}) {
  return (
    <div className="rounded-lg border bg-background p-4 shadow-sm">
      <Badge variant={tone}>{label}</Badge>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function parseDifficulty(value?: string) {
  if (!value) {
    return undefined;
  }

  const difficulty = Number(value);

  return Number.isFinite(difficulty) ? difficulty : undefined;
}

function buildResultSummary(formulas: FormulaSummary[]) {
  return formulas.reduce(
    (summary, formula) => {
      if (formula.trainingStatus === "weak") {
        summary.weakCount += 1;
      }

      if (formula.trainingStatus === "due_now") {
        summary.dueCount += 1;
      }

      if (formula.trainingStatus === "stable") {
        summary.stableCount += 1;
      }

      if (formula.hasPersonalMemoryHook) {
        summary.hookedCount += 1;
      }

      return summary;
    },
    {
      weakCount: 0,
      dueCount: 0,
      stableCount: 0,
      hookedCount: 0,
    },
  );
}

function formatNextReviewAt(nextReviewAt: string | null) {
  if (!nextReviewAt) {
    return "尚未安排";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(nextReviewAt));
}

function formatVariablePreview(formula: FormulaSummary) {
  if (formula.variablePreview.length === 0) {
    return "变量说明将在详情页展开";
  }

  return formula.variablePreview
    .slice(0, 3)
    .map((variable) => `${variable.symbol}（${variable.name}）`)
    .join("、");
}

function createFormulaCatalogHrefBuilder(
  current: Partial<{
    q: string | null;
    domain: string | null;
    tag: string | null;
    difficulty: number | null;
  }>,
) {
  return (
    updates?: Partial<{
      q: string | null;
      domain: string | null;
      tag: string | null;
      difficulty: number | null;
    }>,
  ) => {
    const next = {
      ...current,
      ...updates,
    };
    const searchParams = new URLSearchParams();

    if (next.q !== null && next.q !== undefined && next.q !== "") {
      searchParams.set("q", next.q);
    }

    if (next.domain !== null && next.domain !== undefined && next.domain !== "") {
      searchParams.set("domain", next.domain);
    }

    if (next.tag !== null && next.tag !== undefined && next.tag !== "") {
      searchParams.set("tag", next.tag);
    }

    if (
      next.difficulty !== null &&
      next.difficulty !== undefined &&
      Number.isFinite(next.difficulty)
    ) {
      searchParams.set("difficulty", String(next.difficulty));
    }

    const queryString = searchParams.toString();

    return queryString ? `/formulas?${queryString}` : "/formulas";
  };
}
