import { ChartNoAxesColumn, CheckCircle2, Lightbulb } from "lucide-react";

import { PhaseShell } from "@/components/app/phase-shell";
import { SectionNav } from "@/components/app/section-nav";
import { MemoryHookWorkspace } from "@/components/memory-hooks/memory-hook-workspace";
import { requireCurrentLearner } from "@/server/auth/current-learner";
import { resolveLearningDomain } from "@/server/learning-domain";
import { getFormulaSummaries } from "@/server/services/formula-service";

export const dynamic = "force-dynamic";

export default async function MemoryHooksPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const current = await requireCurrentLearner();
  const params = await searchParams;
  const learningDomain = await resolveLearningDomain(params.domain, current.learner.id);
  const formulas = await getFormulaSummaries({
    domain: learningDomain.currentDomain,
    userId: current.learner.id,
  });

  return (
    <PhaseShell
      activePath="/memory-hooks"
      eyebrow="进展"
      title="整理下次提示"
      description="每条公式只保留一句你下次卡住时最想看到的提醒。"
      learningDomain={learningDomain}
    >
      <SectionNav
        label="进展入口"
        items={[
          {
            href: `/summary?domain=${encodeURIComponent(
              learningDomain.currentDomain,
            )}`,
            label: "训练进展",
            description: "查看结果和下一步。",
            icon: ChartNoAxesColumn,
            active: false,
          },
          {
            href: `/memory-hooks?domain=${encodeURIComponent(
              learningDomain.currentDomain,
            )}`,
            label: "提示整理",
            description: "维护自己的回忆线索。",
            icon: Lightbulb,
            active: true,
          },
          {
            href: `/review?domain=${encodeURIComponent(
              learningDomain.currentDomain,
            )}`,
            label: "回到训练",
            description: "继续今日复习队列。",
            icon: CheckCircle2,
            active: false,
          },
        ]}
      />

      <MemoryHookWorkspace formulas={formulas} />
    </PhaseShell>
  );
}
