"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";

import type { FocusSection } from "@/components/formula/formula-detail-view";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { WeakFormulaStat } from "@/types/stats";

export function WeakFormulaList({
  formulas,
}: {
  formulas: WeakFormulaStat[];
}) {
  useEffect(() => {
    if (formulas.length === 0) {
      return;
    }

    void fetch("/api/stats/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        events: formulas.map((formula) => ({
          formulaId: formula.formulaId,
          type: "weak_formula_impression",
        })),
      }),
    });
  }, [formulas]);

  if (formulas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        当前没有待补弱公式。
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {formulas.map((formula) => (
        <div key={formula.formulaId} className="rounded-lg border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{formula.title}</h3>
            <Badge variant="secondary">{formula.domain}</Badge>
            {formula.latestResult ? <Badge variant="outline">{formula.latestResult}</Badge> : null}
            <Badge variant="outline">{weakPointLabel(formula.weakPoint)}</Badge>
          </div>
          <p className="mt-2 text-sm leading-6">
            {formula.recommendedAction}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Again {formula.againCount}</span>
            <span>Hard {formula.hardCount}</span>
            <span>提示 {formula.memoryHookCount} 条</span>
          </div>
          <div className="mt-4">
            <Link
              href={`/formulas/${formula.slug}?from=summary&focus=${focusSectionForWeakPoint(formula.weakPoint)}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
              onClick={() => {
                void fetch("/api/stats/events", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    events: [
                      {
                        formulaId: formula.formulaId,
                        type: "weak_formula_opened",
                      },
                    ],
                  }),
                });
              }}
            >
              修复这条
              <ArrowRight data-icon="inline-end" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function weakPointLabel(weakPoint: WeakFormulaStat["weakPoint"]) {
  switch (weakPoint) {
    case "retention":
      return "记忆保持";
    case "concept":
      return "概念联想";
    case "boundary":
      return "适用边界";
    case "application":
    default:
      return "应用迁移";
  }
}

function focusSectionForWeakPoint(
  weakPoint: WeakFormulaStat["weakPoint"],
): FocusSection {
  switch (weakPoint) {
    case "boundary":
      return "use";
    case "concept":
    case "retention":
      return "hooks";
    case "application":
    default:
      return "anti-patterns";
  }
}
