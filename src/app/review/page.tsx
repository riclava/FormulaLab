import { Brain, ClipboardCheck, Target } from "lucide-react";

import { PhaseShell } from "@/components/app/phase-shell";
import { SectionNav } from "@/components/app/section-nav";
import { ReviewSession } from "@/components/review/review-session";
import { requireCurrentLearner } from "@/server/auth/current-learner";
import { resolveLearningDomain } from "@/server/learning-domain";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; domain?: string }>;
}) {
  await requireCurrentLearner();
  const params = await searchParams;
  const mode = params.mode === "weak" ? "weak" : "today";
  const learningDomain = await resolveLearningDomain(params.domain);
  const todayHref = `/review?domain=${encodeURIComponent(learningDomain.currentDomain)}`;
  const weakHref = `/review?mode=weak&domain=${encodeURIComponent(
    learningDomain.currentDomain,
  )}`;

  return (
    <PhaseShell
      activePath={mode === "weak" ? "/review?mode=weak" : "/review"}
      eyebrow="训练"
      title={
        mode === "weak"
          ? "重练薄弱公式"
          : "开始今日复习"
      }
      learningDomain={learningDomain}
    >
      <SectionNav
        label="训练入口"
        items={[
          {
            href: todayHref,
            label: "今日复习",
            description: "完成当前到期队列。",
            icon: ClipboardCheck,
            active: mode === "today",
          },
          {
            href: weakHref,
            label: "弱项重练",
            description: "优先修复 Again 和 Hard。",
            icon: Target,
            active: mode === "weak",
          },
          {
            href: `/diagnostic?domain=${encodeURIComponent(
              learningDomain.currentDomain,
            )}`,
            label: "诊断校准",
            description: "重新校准当前知识域。",
            icon: Brain,
            active: false,
          },
        ]}
      />

      <ReviewSession
        key={`${mode}:${learningDomain.currentDomain}`}
        mode={mode}
        domain={learningDomain.currentDomain}
      />
    </PhaseShell>
  );
}
