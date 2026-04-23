import { PhaseShell } from "@/components/app/phase-shell";
import { CustomFormulaForm } from "@/components/formula/custom-formula-form";

export default function NewFormulaPage() {
  return (
    <PhaseShell
      activePath="/formulas"
      eyebrow="自定义公式"
      title="把自己的公式放进同一套训练闭环。"
    >
      <CustomFormulaForm />
    </PhaseShell>
  );
}
