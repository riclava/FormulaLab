import { AlertTriangle, CheckCircle2, Network } from "lucide-react";

import { PhaseShell } from "@/components/app/phase-shell";
import { LatexRenderer } from "@/components/formula/latex-renderer";
import { Badge } from "@/components/ui/badge";

export default function FormulaDetailPage() {
  return (
    <PhaseShell
      activePath="/formulas"
      eyebrow="Phase 4 placeholder"
      title="公式详情会围绕会用、会判断、会补弱来组织。"
      description="后续这里会接入公式内容模型、变量说明、适用条件、误用点、例题、关联公式和记忆钩子。"
    >
      <article className="flex flex-col gap-6 rounded-lg border bg-background p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>概率统计</Badge>
          <Badge variant="secondary">易混淆重点</Badge>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-semibold">贝叶斯定理</h2>
          <p className="text-muted-foreground">
            已知结果发生，反推导致该结果的某个原因的概率。
          </p>
          <LatexRenderer
            block
            expression="P(A \mid B)=\frac{P(B \mid A)P(A)}{P(B)}"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <section className="rounded-lg border p-4">
            <h3 className="mb-2 flex items-center gap-2 font-medium">
              <CheckCircle2 data-icon="inline-start" />
              什么时候用
            </h3>
            <p className="text-sm text-muted-foreground">
              题目给出正向条件概率，但要求反向条件概率。
            </p>
          </section>
          <section className="rounded-lg border p-4">
            <h3 className="mb-2 flex items-center gap-2 font-medium">
              <AlertTriangle data-icon="inline-start" />
              常见误用
            </h3>
            <p className="text-sm text-muted-foreground">
              把 P(A|B) 和 P(B|A) 当成同一个概率。
            </p>
          </section>
          <section className="rounded-lg border p-4">
            <h3 className="mb-2 flex items-center gap-2 font-medium">
              <Network data-icon="inline-start" />
              关联公式
            </h3>
            <p className="text-sm text-muted-foreground">
              全概率公式通常用于展开分母 P(B)。
            </p>
          </section>
        </div>
      </article>
    </PhaseShell>
  );
}
