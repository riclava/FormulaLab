"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Eye, RotateCcw } from "lucide-react";

import { LatexRenderer } from "@/components/formula/latex-renderer";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { FormulaDetail } from "@/types/formula";

export function DerivationTrainer({
  formulas,
}: {
  formulas: FormulaDetail[];
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const formula = formulas[index];

  if (!formula) {
    return (
      <section className="rounded-lg border border-dashed bg-background p-6 text-sm text-muted-foreground">
        当前还没有带推导过程的公式。可以先去自定义公式里补一条推导，或在内容辅助里完善内置内容。
      </section>
    );
  }

  return (
    <section className="grid gap-5 rounded-lg border bg-background p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>推导训练</Badge>
          <Badge variant="outline">
            {index + 1} / {formulas.length}
          </Badge>
          <Badge variant="secondary">{formula.domain}</Badge>
        </div>
        <Link
          href={`/formulas/${formula.slug}?from=derivation&focus=derivation`}
          className={buttonVariants({ size: "sm", variant: "outline" })}
        >
          完整详情
        </Link>
      </div>

      <div className="grid gap-3">
        <h2 className="text-2xl font-semibold">{formula.title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{formula.oneLineUse}</p>
        <LatexRenderer block expression={formula.expressionLatex} />
      </div>

      <div className="rounded-lg border bg-muted/40 p-4">
        <div className="mb-2 flex items-center gap-2">
          <BookOpen data-icon="inline-start" />
          <h3 className="font-medium">先自己说出推导线索</h3>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          先回忆这条公式来自哪个定义、等价变形或前置公式，再点击显示推导。这里练的是“为什么能用”，不是重新背一遍答案。
        </p>
      </div>

      {revealed ? (
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">参考推导</h3>
          <p className="mt-2 text-sm leading-6">{formula.derivation}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => setRevealed(true)} disabled={revealed}>
          <Eye data-icon="inline-start" />
          显示推导
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIndex((previous) => (previous + 1) % formulas.length);
            setRevealed(false);
          }}
        >
          <RotateCcw data-icon="inline-start" />
          下一条待补推导
        </Button>
        <Link href="/review?mode=weak" className={buttonVariants({ variant: "secondary" })}>
          去错题重练
        </Link>
      </div>
    </section>
  );
}
