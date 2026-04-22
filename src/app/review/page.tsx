import { PhaseShell } from "@/components/app/phase-shell";
import { ReviewSession } from "@/components/review/review-session";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = params.mode === "weak" ? "weak" : "today";

  return (
    <PhaseShell
      activePath="/review"
      eyebrow={mode === "weak" ? "V1.5 / 错题重练" : "Phase 3 / 今日复习"}
      title={
        mode === "weak"
          ? "把 Again 和 Hard 先捞回来。"
          : "今天该练什么，会在这里直接展开。"
      }
      description={
        mode === "weak"
          ? "错题重练会优先取记忆强度低、出现 lapse 或难度估计偏高的公式，不必等到下一次到期。"
          : "Review First 是 FormulaLab 的主入口。当前实现已经包含队列生成、提示、显示答案、自评提交和简单调度规则。"
      }
    >
      <ReviewSession mode={mode} />
    </PhaseShell>
  );
}
