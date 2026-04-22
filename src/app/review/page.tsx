import { PhaseShell } from "@/components/app/phase-shell";
import { ReviewSession } from "@/components/review/review-session";

export default function ReviewPage() {
  return (
    <PhaseShell
      activePath="/review"
      eyebrow="Phase 3 / 今日复习"
      title="今天该练什么，会在这里直接展开。"
      description="Review First 是 FormulaLab 的主入口。当前实现已经包含队列生成、提示、显示答案、自评提交和简单调度规则。"
    >
      <ReviewSession />
    </PhaseShell>
  );
}
