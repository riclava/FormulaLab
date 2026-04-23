import { PhaseShell } from "@/components/app/phase-shell";
import { MemoryHookWorkspace } from "@/components/memory-hooks/memory-hook-workspace";
import { requireCurrentLearner } from "@/server/auth/current-learner";
import { getFormulaSummaries } from "@/server/services/formula-service";

export const dynamic = "force-dynamic";

export default async function MemoryHooksPage() {
  const current = await requireCurrentLearner();
  const formulas = await getFormulaSummaries({
    userId: current.learner.id,
  });

  return (
    <PhaseShell
      activePath="/memory-hooks"
      eyebrow="提示整理"
      title="整理联想与默认提示"
      description="集中回看你在复习和补弱中留下的线索，把更有效的那句设成默认。"
    >
      <MemoryHookWorkspace formulas={formulas} />
    </PhaseShell>
  );
}
