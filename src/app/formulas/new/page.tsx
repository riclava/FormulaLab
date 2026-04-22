import { PhaseShell } from "@/components/app/phase-shell";
import { CustomFormulaForm } from "@/components/formula/custom-formula-form";

export default function NewFormulaPage() {
  return (
    <PhaseShell
      activePath="/formulas"
      eyebrow="V1.5 / 用户自定义公式"
      title="把自己的公式放进同一套训练闭环。"
      description="自定义公式不会只停留在列表里，创建后会自动生成三类基础训练题，并立即进入今日复习队列。"
    >
      <CustomFormulaForm />
    </PhaseShell>
  );
}
