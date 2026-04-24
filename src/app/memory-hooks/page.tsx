import { PhaseShell } from "@/components/app/phase-shell";
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
  const learningDomain = await resolveLearningDomain(params.domain);
  const formulas = await getFormulaSummaries({
    domain: learningDomain.currentDomain,
    userId: current.learner.id,
  });

  return (
    <PhaseShell
      activePath="/memory-hooks"
      eyebrow="提示整理"
      title="整理下次提示"
      description="每条公式只保留一句你下次卡住时最想看到的提醒。"
      learningDomain={learningDomain}
    >
      <MemoryHookWorkspace formulas={formulas} />
    </PhaseShell>
  );
}
