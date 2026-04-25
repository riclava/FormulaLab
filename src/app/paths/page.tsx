import Link from "next/link";
import { ArrowRight, BookOpen, BookOpenCheck, Compass, Orbit } from "lucide-react";

import { PhaseShell } from "@/components/app/phase-shell";
import { SectionNav } from "@/components/app/section-nav";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireCurrentLearner } from "@/server/auth/current-learner";
import { resolveLearningDomain } from "@/server/learning-domain";
import { getFormulaCatalog } from "@/server/services/formula-service";

export const dynamic = "force-dynamic";

export default async function PathsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const current = await requireCurrentLearner();
  const params = await searchParams;
  const learningDomain = await resolveLearningDomain(params.domain, current.learner.id);
  const catalog = await getFormulaCatalog({
    domain: learningDomain.currentDomain,
    userId: current.learner.id,
  });
  const stages = groupByStage(catalog.formulas);
  const domainQuery = `domain=${encodeURIComponent(learningDomain.currentDomain)}`;

  return (
    <PhaseShell
      activePath="/paths"
      eyebrow="公式库"
      title="当前知识域路径"
      learningDomain={learningDomain}
    >
      <div className="grid gap-5">
        <SectionNav
          label="公式库入口"
          items={[
            {
              href: `/formulas?${domainQuery}`,
              label: "全部公式",
              description: "查找、筛选和回看公式。",
              icon: BookOpen,
              active: false,
            },
            {
              href: `/paths?${domainQuery}`,
              label: "学习路径",
              description: "按主题结构推进。",
              icon: Compass,
              active: true,
            },
            {
              href: `/derivation?${domainQuery}`,
              label: "推导训练",
              description: "强化公式来龙去脉。",
              icon: Orbit,
              active: false,
            },
          ]}
        />

        {stages.map((stage, stageIndex) => (
          <section key={stage.name} className="rounded-lg border bg-background p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">阶段 {stageIndex + 1}</Badge>
                  <BookOpenCheck data-icon="inline-start" />
                  <h2 className="text-xl font-semibold">{stage.name}</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {stage.formulas.length} 条公式，{stage.weakCount} 条需要补弱，{stage.stableCount} 条稳定中。
                </p>
              </div>
              <Link
                href={`/formulas?${domainQuery}`}
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                查看这一组
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              {stage.formulas.map((formula, index) => (
                <Link
                  key={formula.id}
                  href={`/formulas/${formula.slug}?from=paths&${domainQuery}`}
                  className="grid gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="font-medium">{formula.title}</span>
                    <Badge variant={formula.isWeak ? "destructive" : "secondary"}>
                      {formula.trainingStatusLabel}
                    </Badge>
                    {formula.subdomain ? <Badge variant="outline">{formula.subdomain}</Badge> : null}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {formula.oneLineUse}
                  </p>
                </Link>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={
                  stage.formulas.find((formula) => formula.isWeak)?.slug
                    ? `/formulas/${stage.formulas.find((formula) => formula.isWeak)!.slug}?from=paths&focus=use&${domainQuery}`
                    : `/formulas/${stage.formulas[0]?.slug}?from=paths&${domainQuery}`
                }
                className={buttonVariants({ size: "sm" })}
              >
                继续这组内容
                <ArrowRight data-icon="inline-end" />
              </Link>
              <Link
                href={`/review?mode=weak&${domainQuery}`}
                className={buttonVariants({ size: "sm", variant: "secondary" })}
              >
                练当前薄弱项
              </Link>
            </div>
          </section>
        ))}
      </div>
    </PhaseShell>
  );
}

function groupByStage(formulas: Awaited<ReturnType<typeof getFormulaCatalog>>["formulas"]) {
  const groups = new Map<string, typeof formulas>();

  for (const formula of formulas) {
    const stageName = formula.subdomain ?? formula.tags[0] ?? "基础公式";
    groups.set(stageName, [...(groups.get(stageName) ?? []), formula]);
  }

  return Array.from(groups.entries()).map(([name, items]) => ({
    name,
    formulas: items.sort((left, right) => {
      if ((left.subdomain ?? "") !== (right.subdomain ?? "")) {
        return (left.subdomain ?? "").localeCompare(right.subdomain ?? "", "zh-CN");
      }

      return left.difficulty - right.difficulty;
    }),
    weakCount: items.filter((formula) => formula.isWeak).length,
    stableCount: items.filter((formula) => formula.trainingStatus === "stable").length,
  }));
}
