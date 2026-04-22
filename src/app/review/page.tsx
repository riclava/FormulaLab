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
      eyebrow={mode === "weak" ? "错题重练" : "今日复习"}
      title={
        mode === "weak"
          ? "先把卡住的公式补回来。"
          : "从第一题开始，完成今天的公式复习。"
      }
      description={
        mode === "weak"
          ? "这里优先处理 Again 和 Hard 的内容。看一眼适用条件或记忆钩子，再放回今天的训练节奏。"
          : "先主动回忆，需要时再看提示，最后用 Again、Hard、Good、Easy 告诉系统下次什么时候再练。"
      }
    >
      <ReviewSession mode={mode} />
    </PhaseShell>
  );
}
