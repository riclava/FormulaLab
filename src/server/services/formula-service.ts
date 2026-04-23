import {
  createCustomFormula,
  deleteUserFormulaMemoryHook,
  getFormulaByIdOrSlug,
  listFormulaRelations,
  listFormulaCatalogFacets,
  listFormulaMemoryHooks,
  listFormulas,
  saveUserFormulaMemoryHook,
} from "@/server/repositories/formula-repository";
import type {
  FormulaCatalog,
  FormulaDetail,
  FormulaRelationDetail,
  FormulaSummary,
} from "@/types/formula";
import type { MemoryHookRecord } from "@/types/memory-hook";

type FormulaWithDetail = NonNullable<Awaited<ReturnType<typeof getFormulaByIdOrSlug>>>;
type RelationWithFormula = NonNullable<
  Awaited<ReturnType<typeof listFormulaRelations>>
>[number];

export async function getFormulaSummaries(params?: {
  domain?: string;
  tag?: string;
  difficulty?: number;
  query?: string;
  userId?: string;
}): Promise<FormulaSummary[]> {
  const formulas = await listFormulas(params);
  const now = new Date();

  return formulas
    .map((formula) => toFormulaSummary(formula, now))
    .sort((left, right) => {
      const leftPriority = getTrainingStatusPriority(left.trainingStatus);
      const rightPriority = getTrainingStatusPriority(right.trainingStatus);

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      if (left.domain !== right.domain) {
        return left.domain.localeCompare(right.domain, "zh-CN");
      }

      if (left.difficulty !== right.difficulty) {
        return left.difficulty - right.difficulty;
      }

      return left.title.localeCompare(right.title, "zh-CN");
    });
}

export async function getFormulaCatalog(params?: {
  domain?: string;
  tag?: string;
  difficulty?: number;
  query?: string;
  userId?: string;
}): Promise<FormulaCatalog> {
  const [formulas, facetSource] = await Promise.all([
    getFormulaSummaries(params),
    listFormulaCatalogFacets(),
  ]);

  const tagFrequency = new Map<string, number>();

  for (const formula of facetSource) {
    for (const tag of formula.tags) {
      tagFrequency.set(tag, (tagFrequency.get(tag) ?? 0) + 1);
    }
  }

  return {
    formulas,
    filters: {
      domains: Array.from(new Set(facetSource.map((formula) => formula.domain))),
      difficulties: Array.from(
        new Set(facetSource.map((formula) => formula.difficulty)),
      ).sort((left, right) => left - right),
      tags: Array.from(tagFrequency.entries())
        .sort((left, right) => {
          if (right[1] !== left[1]) {
            return right[1] - left[1];
          }

          return left[0].localeCompare(right[0], "zh-CN");
        })
        .map(([tag]) => tag),
    },
  };
}

export async function addCustomFormula({
  userId,
  input,
}: {
  userId: string;
  input: {
    title: string;
    expressionLatex: string;
    domain?: string;
    subdomain?: string;
    oneLineUse: string;
    meaning?: string;
    derivation?: string;
    useConditions?: string[];
    nonUseConditions?: string[];
    antiPatterns?: string[];
    typicalProblems?: string[];
    examples?: string[];
    difficulty?: number;
    tags?: string[];
    memoryHook?: string;
  };
}) {
  const title = input.title.trim();
  const expressionLatex = input.expressionLatex.trim();
  const oneLineUse = input.oneLineUse.trim();

  if (!title || !expressionLatex || !oneLineUse) {
    throw new Error("title, expressionLatex and oneLineUse are required");
  }

  const domain = input.domain?.trim() || "自定义公式";
  const slug = await createUniqueFormulaSlug(title);
  const difficulty = clampInteger(input.difficulty ?? 2, 1, 5);
  const meaning = input.meaning?.trim() || oneLineUse;
  const useConditions = normalizeTextList(input.useConditions, [
    "题目中的条件与公式变量可以一一对应。",
  ]);
  const nonUseConditions = normalizeTextList(input.nonUseConditions, [
    "变量含义或前提条件无法确认时不要直接套用。",
  ]);
  const antiPatterns = normalizeTextList(input.antiPatterns, [
    "只记表达式但没有确认适用条件。",
  ]);
  const typicalProblems = normalizeTextList(input.typicalProblems, [
    `${title} 的基础识别和代入题。`,
  ]);
  const examples = normalizeTextList(input.examples, [
    `看到题目要求“${oneLineUse}”时，先判断是否可以使用 ${title}。`,
  ]);
  const tags = normalizeTextList(input.tags, ["custom"]);
  const reviewItems = [
    {
      type: "recall" as const,
      prompt: `写出「${title}」的公式表达式。`,
      answer: expressionLatex,
      explanation: oneLineUse,
      difficulty,
    },
    {
      type: "recognition" as const,
      prompt: `题目要求“${oneLineUse}”时，应优先想到哪条公式？`,
      answer: title,
      explanation: `这是 ${title} 的典型使用场景。`,
      difficulty,
    },
    {
      type: "application" as const,
      prompt: examples[0],
      answer: `先确认适用条件，再代入 ${title}。`,
      explanation: meaning,
      difficulty: Math.min(5, difficulty + 1),
    },
  ];

  const formula = await createCustomFormula({
    userId,
    input: {
      slug,
      title,
      expressionLatex,
      domain,
      subdomain: input.subdomain?.trim() || null,
      oneLineUse,
      meaning,
      derivation: input.derivation?.trim() || null,
      useConditions,
      nonUseConditions,
      antiPatterns,
      typicalProblems,
      examples,
      difficulty,
      tags,
      reviewItems,
      memoryHooks: input.memoryHook?.trim()
        ? [
            {
              content: input.memoryHook.trim(),
            },
          ]
        : [],
    },
  });

  return getFormulaDetail(formula.slug);
}

export async function getFormulaDetail(
  idOrSlug: string,
): Promise<FormulaDetail | null> {
  const formula = await getFormulaByIdOrSlug(idOrSlug);

  if (!formula) {
    return null;
  }

  return toFormulaDetail(formula, new Date());
}

export async function getFormulaRelationDetails(
  idOrSlug: string,
): Promise<FormulaRelationDetail[] | null> {
  const relations = await listFormulaRelations(idOrSlug);

  if (!relations) {
    return null;
  }

  return relations.map((relation) => toFormulaRelationDetail(relation, new Date()));
}

export async function getFormulaMemoryHooks({
  formulaIdOrSlug,
  userId,
}: {
  formulaIdOrSlug: string;
  userId?: string;
}) {
  const hooks = await listFormulaMemoryHooks({
    formulaIdOrSlug,
    userId,
  });

  if (!hooks) {
    return null;
  }

  return hooks.map(toMemoryHookRecord);
}

export async function saveFormulaMemoryHook({
  formulaIdOrSlug,
  userId,
  content,
}: {
  formulaIdOrSlug: string;
  userId: string;
  content: string;
}) {
  const hook = await saveUserFormulaMemoryHook({
    formulaIdOrSlug,
    userId,
    content,
  });

  if (!hook) {
    return null;
  }

  return toMemoryHookRecord(hook);
}

export async function removeMemoryHook({
  hookId,
  userId,
}: {
  hookId: string;
  userId: string;
}) {
  return deleteUserFormulaMemoryHook({
    hookId,
    userId,
  });
}

function toFormulaSummary(
  formula: {
    id: string;
    slug: string;
    title: string;
    expressionLatex: string;
    domain: string;
    subdomain: string | null;
    oneLineUse: string;
    difficulty: number;
    tags: string[];
    variables: Array<{
      symbol: string;
      name: string;
    }>;
    memoryHooks: Array<{
      id: string;
    }>;
    userStates?: Array<{
      nextReviewAt: Date | null;
      memoryStrength: number;
      lapseCount: number;
      consecutiveCorrect: number;
      totalReviews: number;
      correctReviews: number;
    }>;
    _count: {
      reviewItems: number;
      memoryHooks: number;
    };
  },
  now: Date,
): FormulaSummary {
  const state = formula.userStates?.[0];
  const hasPersonalMemoryHook = formula.memoryHooks.length > 0;
  const isWeak =
    state !== undefined &&
    (state.memoryStrength < 0.4 || state.lapseCount > 0);
  const isDueNow =
    state?.nextReviewAt !== null &&
    state?.nextReviewAt !== undefined &&
    state.nextReviewAt.getTime() <= now.getTime();
  const isStable =
    state !== undefined &&
    state.memoryStrength >= 0.7 &&
    state.consecutiveCorrect >= 3;
  const trainingStatus = state
    ? isWeak
      ? "weak"
      : isDueNow
        ? "due_now"
        : isStable
          ? "stable"
          : state.totalReviews > 0 && state.nextReviewAt
            ? "scheduled"
            : "learning"
    : "not_started";

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
    variablePreview: formula.variables.map((variable) => ({
      symbol: variable.symbol,
      name: variable.name,
    })),
    reviewItemCount: formula._count.reviewItems,
    memoryHookCount: formula.memoryHooks.length,
    trainingStatus,
    trainingStatusLabel: getTrainingStatusLabel(trainingStatus),
    nextReviewAt: state?.nextReviewAt?.toISOString() ?? null,
    isWeak,
    isDueNow,
    hasPersonalMemoryHook,
    totalReviews: state?.totalReviews ?? 0,
    correctReviews: state?.correctReviews ?? 0,
  };
}

function toFormulaDetail(formula: FormulaWithDetail, now: Date): FormulaDetail {
  return {
    ...toFormulaSummary(formula, now),
    meaning: formula.meaning,
    intuition: formula.intuition,
    derivation: formula.derivation,
    useConditions: formula.useConditions,
    nonUseConditions: formula.nonUseConditions,
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
    memoryHooks: formula.memoryHooks.map((hook) => toMemoryHookRecord(hook)),
  };
}

function toFormulaRelationDetail(
  relation: RelationWithFormula,
  now: Date,
): FormulaRelationDetail {
  return {
    id: relation.id,
    relationType: relation.relationType,
    note: relation.note,
    formula: toFormulaSummary(relation.toFormula, now),
  };
}

function toMemoryHookRecord(hook: {
  id: string;
  content: string;
  updatedAt: Date | string;
}): MemoryHookRecord {
  return {
    id: hook.id,
    content: hook.content,
    updatedAt:
      hook.updatedAt instanceof Date ? hook.updatedAt.toISOString() : hook.updatedAt,
  };
}

function getTrainingStatusPriority(status: FormulaSummary["trainingStatus"]) {
  switch (status) {
    case "weak":
      return 0;
    case "due_now":
      return 1;
    case "learning":
      return 2;
    case "not_started":
      return 3;
    case "scheduled":
      return 4;
    case "stable":
      return 5;
    default:
      return 6;
  }
}

function getTrainingStatusLabel(status: FormulaSummary["trainingStatus"]) {
  switch (status) {
    case "weak":
      return "需要补弱";
    case "due_now":
      return "今天该复习";
    case "learning":
      return "正在建立";
    case "scheduled":
      return "已安排复习";
    case "stable":
      return "稳定中";
    case "not_started":
    default:
      return "尚未进入训练";
  }
}

async function createUniqueFormulaSlug(title: string) {
  const baseSlug =
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "custom-formula";
  let candidate = baseSlug;
  let index = 1;

  while (await getFormulaByIdOrSlug(candidate)) {
    index += 1;
    candidate = `${baseSlug}-${index}`;
  }

  return candidate;
}

function normalizeTextList(value: string[] | undefined, fallback: string[]) {
  const items = value
    ?.flatMap((item) => item.split("\n"))
    .map((item) => item.trim())
    .filter(Boolean);

  return items && items.length > 0 ? items : fallback;
}

function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, Math.round(value)));
}
