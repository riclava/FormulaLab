import { BookOpen, Compass, Orbit } from "lucide-react";

import { DerivationTrainer } from "@/components/derivation/derivation-trainer";
import { PhaseShell } from "@/components/app/phase-shell";
import { SectionNav } from "@/components/app/section-nav";
import { requireCurrentLearner } from "@/server/auth/current-learner";
import { resolveLearningDomain } from "@/server/learning-domain";
import { getFormulaDetail, getFormulaSummaries } from "@/server/services/formula-service";

export const dynamic = "force-dynamic";

export default async function DerivationPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const current = await requireCurrentLearner();
  const params = await searchParams;
  const learningDomain = await resolveLearningDomain(params.domain, current.learner.id);
  const summaries = await getFormulaSummaries({
    domain: learningDomain.currentDomain,
    userId: current.learner.id,
  });
  const details = (
    await Promise.all(
      summaries.map((formula) =>
        getFormulaDetail({
          idOrSlug: formula.slug,
          userId: current.learner.id,
        }),
      ),
    )
  ).filter((formula) => formula?.derivation) as NonNullable<
    Awaited<ReturnType<typeof getFormulaDetail>>
  >[];
  const domainQuery = `domain=${encodeURIComponent(learningDomain.currentDomain)}`;

  return (
    <PhaseShell
      activePath="/derivation"
      eyebrow="公式库"
      title="推导练习"
      learningDomain={learningDomain}
    >
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
            active: false,
          },
          {
            href: `/derivation?${domainQuery}`,
            label: "推导训练",
            description: "强化公式来龙去脉。",
            icon: Orbit,
            active: true,
          },
        ]}
      />

      <DerivationTrainer domain={learningDomain.currentDomain} formulas={details} />
    </PhaseShell>
  );
}
