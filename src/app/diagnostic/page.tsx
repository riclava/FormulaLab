import { Brain, ClipboardCheck, Target } from "lucide-react";

import { DiagnosticQuiz } from "@/components/diagnostic/diagnostic-quiz";
import { PhaseShell } from "@/components/app/phase-shell";
import { SectionNav } from "@/components/app/section-nav";
import { requireCurrentLearner } from "@/server/auth/current-learner";
import { resolveLearningDomain } from "@/server/learning-domain";

export default async function DiagnosticPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const current = await requireCurrentLearner();
  const params = await searchParams;
  const learningDomain = await resolveLearningDomain(params.domain, current.learner.id);
  const domainQuery = `domain=${encodeURIComponent(learningDomain.currentDomain)}`;

  return (
    <PhaseShell
      activePath="/diagnostic"
      eyebrow="训练"
      title="诊断校准"
      learningDomain={learningDomain}
    >
      <SectionNav
        label="训练入口"
        items={[
          {
            href: `/review?${domainQuery}`,
            label: "今日复习",
            description: "完成当前到期队列。",
            icon: ClipboardCheck,
            active: false,
          },
          {
            href: `/review?mode=weak&${domainQuery}`,
            label: "弱项重练",
            description: "优先修复 Again 和 Hard。",
            icon: Target,
            active: false,
          },
          {
            href: `/diagnostic?${domainQuery}`,
            label: "诊断校准",
            description: "重新校准当前知识域。",
            icon: Brain,
            active: true,
          },
        ]}
      />

      <DiagnosticQuiz domain={learningDomain.currentDomain} />
    </PhaseShell>
  );
}
