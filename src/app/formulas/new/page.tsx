import { PhaseShell } from "@/components/app/phase-shell";
import { CustomFormulaForm } from "@/components/formula/custom-formula-form";

export default function NewFormulaPage() {
  return (
    <PhaseShell
      activePath="/formulas"
      eyebrow="自定义公式"
      title="把自己的公式放进同一套训练闭环。"
      description="先把最小可练的信息填进去，系统会自动生成三类基础训练题。创建完先看详情确认边界，再决定是不是马上进入训练。"
    >
      <CustomFormulaForm />
    </PhaseShell>
  );
}
