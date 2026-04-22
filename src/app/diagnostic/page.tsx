import { DiagnosticQuiz } from "@/components/diagnostic/diagnostic-quiz";
import { PhaseShell } from "@/components/app/phase-shell";

export default function DiagnosticPage() {
  return (
    <PhaseShell
      activePath="/diagnostic"
      eyebrow="Phase 2 / 首次诊断"
      title="用 3-5 道题快速生成今日复习任务。"
      description="诊断会根据用户自评标记初始薄弱公式，并把 Again/Hard 风险最高的内容放进后续复习队列。"
    >
      <DiagnosticQuiz />
    </PhaseShell>
  );
}
