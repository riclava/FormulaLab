import { DiagnosticQuiz } from "@/components/diagnostic/diagnostic-quiz";
import { PhaseShell } from "@/components/app/phase-shell";
import { requireCurrentLearner } from "@/server/auth/current-learner";

export default async function DiagnosticPage() {
  await requireCurrentLearner();

  return (
    <PhaseShell
      activePath="/diagnostic"
      eyebrow="首次诊断"
      title="开始诊断"
    >
      <DiagnosticQuiz />
    </PhaseShell>
  );
}
