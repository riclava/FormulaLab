import { PhaseShell } from "@/components/app/phase-shell";
import { MemoryHookWorkspace } from "@/components/memory-hooks/memory-hook-workspace";
import { getFormulaSummaries } from "@/server/services/formula-service";

export const dynamic = "force-dynamic";

export default async function MemoryHooksPage() {
  const formulas = await getFormulaSummaries();

  return (
    <PhaseShell
      activePath="/memory-hooks"
      eyebrow="记忆钩子"
      title="把提示写成你自己的话，下次回忆会轻很多。"
    >
      <MemoryHookWorkspace formulas={formulas} />
    </PhaseShell>
  );
}
