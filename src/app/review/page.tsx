import { Clock, Lightbulb, RotateCcw } from "lucide-react";

import { PhaseShell } from "@/components/app/phase-shell";
import { LatexRenderer } from "@/components/formula/latex-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ReviewPage() {
  return (
    <PhaseShell
      activePath="/review"
      eyebrow="Phase 0 scaffold / Review First"
      title="今日复习会是 FormulaLab 的默认入口。"
      description="Phase 0 先确认训练场景的位置和技术骨架；Phase 3 会把这里替换成真正的 Review 队列、提示、答案和自评流程。"
    >
      <section className="rounded-lg border bg-background p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge>主动回忆</Badge>
            <span className="text-sm text-muted-foreground">示例 1 / 8</span>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">
              写出贝叶斯定理的核心表达式。
            </h2>
            <LatexRenderer
              block
              expression="P(A \mid B)=\frac{P(B \mid A)P(A)}{P(B)}"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary">
              <Lightbulb data-icon="inline-start" />
              给我一点提示
            </Button>
            <Button>
              <Clock data-icon="inline-start" />
              显示答案
            </Button>
            <Button variant="outline">
              <RotateCcw data-icon="inline-start" />
              先去诊断
            </Button>
          </div>
        </div>
      </section>
    </PhaseShell>
  );
}
