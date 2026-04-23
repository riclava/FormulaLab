import { DiagnosticQuiz } from "@/components/diagnostic/diagnostic-quiz";
import { PhaseShell } from "@/components/app/phase-shell";

export default function DiagnosticPage() {
  return (
    <PhaseShell
      activePath="/diagnostic"
      eyebrow="首次诊断"
      title="用几道题找到今天最该练的公式。"
    >
      <DiagnosticQuiz />
    </PhaseShell>
  );
}
