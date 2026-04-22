import {
  createAiFormulaMemoryHooks,
  createUserFormulaMemoryHook,
  deleteUserFormulaMemoryHook,
  getFormulaByIdOrSlug,
  getFormulaMemoryHookById,
  listFormulaRelations,
  listFormulaMemoryHooks,
  listFormulas,
  markMemoryHookHelpful,
  markMemoryHookUsed,
  selectFormulaMemoryHook,
  updateUserFormulaMemoryHook,
} from "@/server/repositories/formula-repository";
import type {
  FormulaDetail,
  FormulaRelationDetail,
  FormulaSummary,
} from "@/types/formula";
import type { MemoryHookRecord, MemoryHookType } from "@/types/memory-hook";

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

  return hooks.map((hook) => ({
    ...toMemoryHookRecord(hook),
  }));
}

export async function addUserFormulaMemoryHook({
  formulaIdOrSlug,
  userId,
  content,
  prompt,
  type,
}: {
  formulaIdOrSlug: string;
  userId: string;
  content: string;
  prompt?: string;
  type?: MemoryHookType;
}) {
  const hook = await createUserFormulaMemoryHook({
    formulaIdOrSlug,
    userId,
    content,
    prompt,
    type,
  });

  if (!hook) {
    return null;
  }

  return toMemoryHookRecord(hook);
}

export async function chooseFormulaMemoryHook({
  formulaIdOrSlug,
  hookId,
  userId,
}: {
  formulaIdOrSlug: string;
  hookId: string;
  userId?: string;
}) {
  const hook = await selectFormulaMemoryHook({
    formulaIdOrSlug,
    hookId,
    userId,
  });

  if (!hook) {
    return null;
  }

  return toMemoryHookRecord(hook);
}

export async function adoptAiMemoryHook({
  formulaIdOrSlug,
  sourceHookId,
  userId,
  content,
  prompt,
  type,
}: {
  formulaIdOrSlug: string;
  sourceHookId: string;
  userId: string;
  content?: string;
  prompt?: string;
  type?: MemoryHookType;
}) {
  const sourceHook = await getFormulaMemoryHookById({
    hookId: sourceHookId,
    userId,
  });

  if (!sourceHook || sourceHook.formula.slug !== formulaIdOrSlug && sourceHook.formula.id !== formulaIdOrSlug) {
    return null;
  }

  const hook = await createUserFormulaMemoryHook({
    formulaIdOrSlug,
    userId,
    content: content?.trim() || sourceHook.content,
    prompt: prompt?.trim() || sourceHook.prompt || undefined,
    type: type ?? sourceHook.type,
  });

  if (!hook) {
    return null;
  }

  return toMemoryHookRecord(hook);
}

export async function updateMemoryHook({
  hookId,
  userId,
  content,
  prompt,
  type,
}: {
  hookId: string;
  userId: string;
  content?: string;
  prompt?: string | null;
  type?: MemoryHookType;
}) {
  const hook = await updateUserFormulaMemoryHook({
    hookId,
    userId,
    content,
    prompt,
    type,
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

export async function recordMemoryHookHelpful({
  hookId,
  userId,
}: {
  hookId: string;
  userId?: string;
}) {
  const hook = await markMemoryHookHelpful({
    hookId,
    userId,
  });

  if (!hook) {
    return null;
  }

  return toMemoryHookRecord(hook);
}

export async function recordMemoryHookUsed({
  hookId,
  userId,
}: {
  hookId: string;
  userId?: string;
}) {
  const hook = await markMemoryHookUsed({
    hookId,
    userId,
  });

  if (!hook) {
    return null;
  }

  return toMemoryHookRecord(hook);
}

export async function suggestFormulaMemoryHooks({
  formulaIdOrSlug,
}: {
  formulaIdOrSlug: string;
}) {
  const formula = await getFormulaDetail(formulaIdOrSlug);

  if (!formula) {
    return null;
  }

  const existingAiHooks = formula.memoryHooks.filter(
    (hook) => hook.source === "ai_suggested",
  );

  if (existingAiHooks.length >= 3) {
    return existingAiHooks;
  }

  const blueprints: Array<{
    type: MemoryHookType;
    content: string;
    prompt?: string;
  }> = [
    {
      type: "scenario",
      content: `当题目出现“${formula.typicalProblems[0] ?? formula.domain}”这类场景时，先想到 ${formula.title}。`,
      prompt: "绑定常见应用题型。",
    },
    {
      type: "visual",
      content: `先在脑中放一个画面：${formula.examples[0] ?? formula.oneLineUse}`,
      prompt: "用图像或题面画面帮助回忆。",
    },
    {
      type: "contrast",
      content: `先提醒自己：${formula.antiPatterns[0] ?? formula.nonUseConditions[0] ?? formula.useConditions[0]}`,
      prompt: "把易错点变成反向提醒。",
    },
    {
      type: "analogy",
      content: `把 ${formula.title} 想成“${formula.oneLineUse}”这件事的快捷模板。`,
      prompt: "用一句熟悉的动作描述来类比公式用途。",
    },
    {
      type: "mnemonic",
      content: `${formula.title}：先看条件，再按结构一步步代入。`,
      prompt: "压成一句上手时能默念的短句。",
    },
  ];

  const existingKeys = new Set(
    existingAiHooks.map((hook) => `${hook.type}:${hook.content}`),
  );
  const missingHooks = blueprints
    .filter((hook) => !existingKeys.has(`${hook.type}:${hook.content}`))
    .slice(0, Math.max(0, 3 - existingAiHooks.length));

  if (missingHooks.length === 0) {
    return existingAiHooks;
  }

  const createdHooks = await createAiFormulaMemoryHooks({
    formulaIdOrSlug,
    hooks: missingHooks,
  });

  if (!createdHooks) {
    return null;
  }

  return [...existingAiHooks, ...createdHooks.map(toMemoryHookRecord)];
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
    memoryHooks: formula.memoryHooks.map(toMemoryHookRecord),
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

function toMemoryHookRecord(hook: {
  id: string;
  source: MemoryHookRecord["source"];
  type: MemoryHookRecord["type"];
  content: string;
  prompt: string | null;
  usedCount: number;
  helpfulCount: number;
  lastUsedAt: Date | string | null;
}): MemoryHookRecord {
  return {
    id: hook.id,
    source: hook.source,
    type: hook.type,
    content: hook.content,
    prompt: hook.prompt,
    usedCount: hook.usedCount,
    helpfulCount: hook.helpfulCount,
    lastUsedAt:
      hook.lastUsedAt instanceof Date
        ? hook.lastUsedAt.toISOString()
        : hook.lastUsedAt,
  };
}
