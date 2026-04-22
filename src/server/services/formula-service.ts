import {
  getFormulaByIdOrSlug,
  listFormulaRelations,
  listFormulas,
} from "@/server/repositories/formula-repository";
import type {
  FormulaDetail,
  FormulaRelationDetail,
  FormulaSummary,
} from "@/types/formula";

type FormulaWithCounts = Awaited<ReturnType<typeof listFormulas>>[number];
type FormulaWithDetail = NonNullable<Awaited<ReturnType<typeof getFormulaByIdOrSlug>>>;
type RelationWithFormula = NonNullable<
  Awaited<ReturnType<typeof listFormulaRelations>>
>[number];

export async function getFormulaSummaries(params?: {
  domain?: string;
  query?: string;
}): Promise<FormulaSummary[]> {
  const formulas = await listFormulas(params);

  return formulas.map(toFormulaSummary);
}

export async function getFormulaDetail(
  idOrSlug: string,
): Promise<FormulaDetail | null> {
  const formula = await getFormulaByIdOrSlug(idOrSlug);

  if (!formula) {
    return null;
  }

  return toFormulaDetail(formula);
}

export async function getFormulaRelationDetails(
  idOrSlug: string,
): Promise<FormulaRelationDetail[] | null> {
  const relations = await listFormulaRelations(idOrSlug);

  if (!relations) {
    return null;
  }

  return relations.map(toFormulaRelationDetail);
}

function toFormulaSummary(formula: FormulaWithCounts): FormulaSummary {
  return {
    id: formula.id,
    slug: formula.slug,
    title: formula.title,
    expressionLatex: formula.expressionLatex,
    domain: formula.domain,
    subdomain: formula.subdomain,
    oneLineUse: formula.oneLineUse,
    difficulty: formula.difficulty,
    tags: formula.tags,
    reviewItemCount: formula._count.reviewItems,
    memoryHookCount: formula._count.memoryHooks,
  };
}

function toFormulaDetail(formula: FormulaWithDetail): FormulaDetail {
  return {
    ...toFormulaSummary(formula),
    meaning: formula.meaning,
    intuition: formula.intuition,
    derivation: formula.derivation,
    useConditions: formula.useConditions,
    antiPatterns: formula.antiPatterns,
    typicalProblems: formula.typicalProblems,
    examples: formula.examples,
    variables: formula.variables.map((variable) => ({
      id: variable.id,
      symbol: variable.symbol,
      name: variable.name,
      description: variable.description,
      unit: variable.unit,
      sortOrder: variable.sortOrder,
    })),
    reviewItems: formula.reviewItems.map((item) => ({
      id: item.id,
      type: item.type,
      prompt: item.prompt,
      answer: item.answer,
      explanation: item.explanation,
      difficulty: item.difficulty,
    })),
    memoryHooks: formula.memoryHooks.map((hook) => ({
      id: hook.id,
      source: hook.source,
      type: hook.type,
      content: hook.content,
      prompt: hook.prompt,
    })),
  };
}

function toFormulaRelationDetail(
  relation: RelationWithFormula,
): FormulaRelationDetail {
  return {
    id: relation.id,
    relationType: relation.relationType,
    note: relation.note,
    formula: toFormulaSummary(relation.toFormula),
  };
}
