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
      eyebrow="记忆钩子"
      title="管理记忆钩子"
    >
      <MemoryHookWorkspace formulas={formulas} />
    </PhaseShell>
  );
}
