"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Eye, RotateCcw } from "lucide-react";

import { LatexRenderer } from "@/components/formula/latex-renderer";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { FormulaDetail } from "@/types/formula";

export function DerivationTrainer({
  domain,
  formulas,
}: {
  domain: string;
  formulas: FormulaDetail[];
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const formula = formulas[index];

  if (!formula) {
    return (
      <section className="rounded-lg border border-dashed bg-background p-6 text-sm text-muted-foreground">
        当前没有可练的推导内容。
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
        <LatexRenderer block expression={formula.expressionLatex} />
      </div>

      <div className="rounded-lg border bg-muted/40 p-4">
        <div className="mb-2 flex items-center gap-2">
          <BookOpen data-icon="inline-start" />
          <h3 className="font-medium">先自己回忆推导</h3>
        </div>
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
        <Link
          href={`/review?mode=weak&domain=${encodeURIComponent(domain)}`}
          className={buttonVariants({ variant: "secondary" })}
        >
          去错题重练
        </Link>
      </div>
    </section>
  );
}
