import Link from "next/link";
import { Search } from "lucide-react";

import { PhaseShell } from "@/components/app/phase-shell";
import { LatexRenderer } from "@/components/formula/latex-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function FormulasPage() {
  return (
    <PhaseShell
      activePath="/formulas"
      eyebrow="Phase 7 placeholder"
      title="公式列表只作为查找和回看入口。"
      description="V1 的主流程仍然是今日复习。列表页后续会支持搜索、筛选、训练状态和下次复习时间。"
    >
      <section className="flex flex-col gap-5 rounded-lg border bg-background p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <Label htmlFor="formula-search">搜索公式</Label>
          <div className="flex gap-2">
            <Input
              id="formula-search"
              placeholder="搜索标题、变量、关键词"
              type="search"
            />
            <Button type="button" variant="secondary">
              <Search data-icon="inline-start" />
              搜索
            </Button>
          </div>
        </div>

        <Link
          href="/formulas/bayes-theorem"
          className="flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/60"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">贝叶斯定理</h2>
            <Badge variant="secondary">概率统计</Badge>
            <Badge variant="outline">示例内容</Badge>
          </div>
          <LatexRenderer expression="P(A \mid B)=\frac{P(B \mid A)P(A)}{P(B)}" />
          <p className="text-sm text-muted-foreground">
            已知结果发生，反推导致该结果的某个原因的概率。
          </p>
        </Link>
      </section>
    </PhaseShell>
  );
}
