import { Target } from "lucide-react";

import { PhaseShell } from "@/components/app/phase-shell";
import { Button } from "@/components/ui/button";

const options = ["完全没头绪", "有点印象", "很清楚，能写出来"];

export default function DiagnosticPage() {
  return (
    <PhaseShell
      activePath="/diagnostic"
      eyebrow="Phase 2 placeholder"
      title="首次诊断会把新用户直接带入训练状态。"
      description="这里先保留 3-5 题诊断的页面边界。后续会根据代表性 ReviewItem 生成初始薄弱公式和今日复习任务。"
    >
      <section className="flex flex-col gap-6 rounded-lg border bg-background p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-muted">
            <Target data-icon="inline-start" />
          </span>
          <div>
            <p className="text-sm font-medium">问题 1 / 3</p>
            <p className="text-sm text-muted-foreground">概率统计默认知识域</p>
          </div>
        </div>

        <h2 className="max-w-2xl text-xl font-semibold">
          已知抽取的零件是次品，要求它来自某条流水线，第一反应应该使用什么公式？
        </h2>

        <div className="grid gap-3 sm:grid-cols-3">
          {options.map((option) => (
            <Button key={option} variant="outline">
              {option}
            </Button>
          ))}
        </div>
      </section>
    </PhaseShell>
  );
}
