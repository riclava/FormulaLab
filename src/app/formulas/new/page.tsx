import { PhaseShell } from "@/components/app/phase-shell";
import { OfficialFormulaForm } from "@/components/admin/official-formula-form";
import { requireCurrentLearner } from "@/server/auth/current-learner";

export default async function NewFormulaPage() {
  await requireCurrentLearner();

  return (
    <PhaseShell
      activePath="/formulas"
      eyebrow="自定义公式"
      title="添加自定义公式"
      density="compact"
    >
      <OfficialFormulaForm variant="custom" mode="create" />
    </PhaseShell>
  );
}
