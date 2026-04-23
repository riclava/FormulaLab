"use client";

import { useMemo, useState } from "react";
import { BookOpen, Lightbulb } from "lucide-react";

import { FormulaMemoryHookPanel } from "@/components/memory-hooks/formula-memory-hook-panel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FormulaSummary } from "@/types/formula";

export function MemoryHookWorkspace({
  formulas,
}: {
  formulas: FormulaSummary[];
}) {
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(
    formulas[0]?.slug ?? "",
  );

  const selectedFormula = useMemo(
    () =>
      formulas.find(
        (formula) =>
          formula.slug === selectedFormulaId || formula.id === selectedFormulaId,
      ) ?? formulas[0] ?? null,
    [formulas, selectedFormulaId],
  );

  if (!selectedFormula) {
    return (
      <section className="rounded-lg border bg-background p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">当前还没有可整理提示的公式。</p>
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4 rounded-lg border bg-background p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <BookOpen data-icon="inline-start" />
          <h2 className="font-medium">选择公式</h2>
        </div>
        <div className="grid gap-2">
          {formulas.map((formula) => {
            const active = formula.slug === selectedFormula.slug;

            return (
              <button
                key={formula.id}
                type="button"
                onClick={() => setSelectedFormulaId(formula.slug)}
                className={cn(
                  "rounded-lg border px-3 py-3 text-left transition-colors",
                  active ? "border-primary bg-primary/5" : "hover:bg-muted/60",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{formula.title}</span>
                  <Badge variant="secondary">{formula.domain}</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {formula.oneLineUse}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="flex min-w-0 flex-col gap-6">
        <section className="rounded-lg border bg-background p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>选公式</Badge>
            <Badge variant="outline">回看这条公式的线索</Badge>
            <Badge variant="outline">设默认提示</Badge>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{selectedFormula.domain}</Badge>
            {selectedFormula.subdomain ? (
              <Badge variant="outline">{selectedFormula.subdomain}</Badge>
            ) : null}
          </div>
          <h2 className="mt-3 text-2xl font-semibold">{selectedFormula.title}</h2>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Lightbulb data-icon="inline-start" />
              {selectedFormula.memoryHookCount} 条可用提示
            </span>
          </div>
        </section>

        <FormulaMemoryHookPanel
          key={selectedFormula.slug}
          formulaIdOrSlug={selectedFormula.slug}
          selectableHooks
        />
      </div>
    </div>
  );
}
