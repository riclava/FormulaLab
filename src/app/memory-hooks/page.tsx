import { PhaseShell } from "@/components/app/phase-shell";
import { MemoryHookWorkspace } from "@/components/memory-hooks/memory-hook-workspace";
import { getFormulaSummaries } from "@/server/services/formula-service";

export const dynamic = "force-dynamic";

export default async function MemoryHooksPage() {
  const formulas = await getFormulaSummaries();

  return (
    <PhaseShell
      activePath="/memory-hooks"
      eyebrow="Phase 5 / 记忆钩子"
      title="把公式挂到你已经熟悉的经验上，回忆会轻很多。"
      description="这里可以管理 AI 推荐候选、个人联想、提示优先级，以及联想在复习里是否真的帮到了你。"
    >
      <MemoryHookWorkspace formulas={formulas} />
    </PhaseShell>
  );
}
