import { notFound } from "next/navigation";

import {
  OfficialFormulaForm,
  type OfficialFormulaFormValue,
} from "@/components/admin/official-formula-form";
import { PhaseShell } from "@/components/app/phase-shell";
import { normalizeRouteParam } from "@/lib/route-params";
import { requireCurrentLearner } from "@/server/auth/current-learner";
import { getFormulaDetail } from "@/server/services/formula-service";
import type { FormulaDetail } from "@/types/formula";

export const dynamic = "force-dynamic";

export default async function EditPersonalFormulaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const current = await requireCurrentLearner();
  const { id: rawId } = await params;
  const id = normalizeRouteParam(rawId);
  const formula = await getFormulaDetail({
    idOrSlug: id,
    userId: current.learner.id,
  });

  if (!formula || formula.ownership !== "personal") {
    notFound();
  }

  return (
    <PhaseShell
      activePath="/formulas"
      eyebrow="我的公式"
      title={`编辑 ${formula.title}`}
      density="compact"
    >
      <OfficialFormulaForm
        variant="custom"
        mode="edit"
        initialValue={toFormValue(formula)}
      />
    </PhaseShell>
  );
}

function toFormValue(formula: FormulaDetail): OfficialFormulaFormValue {
  return {
    slug: formula.slug,
    title: formula.title,
    expressionLatex: formula.expressionLatex,
    domain: formula.domain,
    subdomain: formula.subdomain,
    oneLineUse: formula.oneLineUse,
    meaning: formula.meaning,
    intuition: formula.intuition,
    derivation: formula.derivation,
    useConditions: formula.useConditions,
    nonUseConditions: formula.nonUseConditions,
    antiPatterns: formula.antiPatterns,
    typicalProblems: formula.typicalProblems,
    examples: formula.examples,
    plotConfig: formula.plotConfig,
    difficulty: formula.difficulty,
    tags: formula.tags,
    variables: formula.variables.map((variable) => ({
      symbol: variable.symbol,
      name: variable.name,
      description: variable.description,
      unit: variable.unit,
    })),
    reviewItems: formula.reviewItems.map((item) => ({
      type: item.type,
      prompt: item.prompt,
      answer: item.answer,
      explanation: item.explanation,
      difficulty: item.difficulty,
    })),
    relations: [],
  };
}
