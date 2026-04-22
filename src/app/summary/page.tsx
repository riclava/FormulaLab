import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";

import { PhaseShell } from "@/components/app/phase-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const results = [
  { label: "Again", value: 1 },
  { label: "Hard", value: 2 },
  { label: "Good", value: 5 },
  { label: "Easy", value: 0 },
];

export default function SummaryPage() {
  return (
    <PhaseShell
      activePath="/summary"
      eyebrow="Phase 6 placeholder"
      title="复习总结会替代传统 Dashboard 首屏。"
      description="用户完成训练后，在这里看到本次表现、薄弱公式、记忆钩子使用情况和下一次计划。"
    >
      <section className="flex flex-col gap-6 rounded-lg border bg-background p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-muted">
            <BarChart3 data-icon="inline-start" />
          </span>
          <div>
            <h2 className="font-semibold">今日复习完成</h2>
            <p className="text-sm text-muted-foreground">
              示例总结数据会在 Phase 6 接入真实 study session。
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {results.map((result) => (
            <div key={result.label} className="rounded-lg border p-4">
              <p className="text-2xl font-semibold">{result.value}</p>
              <p className="text-sm text-muted-foreground">{result.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <Badge variant="secondary" className="mb-2">
              建议补弱
            </Badge>
            <p className="font-medium">贝叶斯定理</p>
            <p className="text-sm text-muted-foreground">
              Hard/Again 后优先查看适用条件和常见误用。
            </p>
          </div>
          <Link
            href="/formulas/bayes-theorem"
            className={buttonVariants({ variant: "outline" })}
          >
            打开详情
            <ArrowRight data-icon="inline-end" />
          </Link>
        </div>
      </section>
    </PhaseShell>
  );
}
