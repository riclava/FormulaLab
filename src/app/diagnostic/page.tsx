import { DiagnosticQuiz } from "@/components/diagnostic/diagnostic-quiz";
import { PhaseShell } from "@/components/app/phase-shell";

export default function DiagnosticPage() {
  return (
    <PhaseShell
      activePath="/diagnostic"
      eyebrow="首次诊断"
      title="用几道题找到今天最该练的公式。"
      description="不用考试感很重。看题、想一想、再按熟悉程度自评，系统会把薄弱公式放进今日复习队列。"
    >
      <DiagnosticQuiz />
    </PhaseShell>
  );
}
