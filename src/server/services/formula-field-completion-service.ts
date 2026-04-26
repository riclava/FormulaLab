import { createChatCompletion } from "@/server/services/openai-compatible-client";

export type FormulaFieldCompletionVariant = "official" | "custom";
export type FormulaFieldCompletionMode = "create" | "edit";

export type FormulaCompletionSection =
  | "previewCore"
  | "basics"
  | "classification"
  | "expression"
  | "explanation"
  | "conditions"
  | "examples"
  | "variables"
  | "reviewItems"
  | "relations";

export type FormulaFieldCompletionFormula = {
  slug?: string;
  title?: string;
  expressionLatex?: string;
  domain?: string;
  subdomain?: string | null;
  oneLineUse?: string;
  meaning?: string;
  intuition?: string | null;
  derivation?: string | null;
  useConditions?: string[];
  nonUseConditions?: string[];
  antiPatterns?: string[];
  typicalProblems?: string[];
  examples?: string[];
  difficulty?: number;
  tags?: string[];
  memoryHook?: string;
  variables?: FormulaVariablePatch[];
  reviewItems?: FormulaReviewItemPatch[];
  relations?: FormulaRelationPatch[];
};

export type FormulaVariablePatch = {
  symbol: string;
  name: string;
  description: string;
  unit?: string | null;
};

export type FormulaReviewItemPatch = {
  type: "recall" | "recognition" | "application";
  prompt: string;
  answer: string;
  explanation?: string | null;
  difficulty: number;
};

export type FormulaRelationPatch = {
  toSlug: string;
  relationType: "prerequisite" | "related" | "confusable" | "application_of";
  note?: string | null;
};

export type FormulaCompletionPatch = Partial<
  Pick<
    FormulaFieldCompletionFormula,
    | "slug"
    | "title"
    | "expressionLatex"
    | "domain"
    | "subdomain"
    | "oneLineUse"
    | "meaning"
    | "intuition"
    | "derivation"
    | "useConditions"
    | "nonUseConditions"
    | "antiPatterns"
    | "typicalProblems"
    | "examples"
    | "difficulty"
    | "tags"
    | "memoryHook"
    | "variables"
    | "reviewItems"
    | "relations"
  >
>;

export type FormulaFieldCompletionRelationOption = {
  slug: string;
  title: string;
};

type SectionConfig = {
  label: string;
  fields: Array<keyof FormulaCompletionPatch>;
};

const REVIEW_ITEM_TYPES = ["recall", "recognition", "application"] as const;
const RELATION_TYPES = [
  "prerequisite",
  "related",
  "confusable",
  "application_of",
] as const;

const SECTION_CONFIGS = {
  previewCore: {
    label: "核心内容预览",
    fields: ["title", "expressionLatex", "oneLineUse"],
  },
  basics: {
    label: "基础信息",
    fields: ["slug", "title", "domain", "difficulty"],
  },
  classification: {
    label: "分类与提示",
    fields: ["subdomain", "tags", "memoryHook"],
  },
  expression: {
    label: "表达式与用途",
    fields: ["expressionLatex", "oneLineUse"],
  },
  explanation: {
    label: "理解说明",
    fields: ["meaning", "intuition", "derivation"],
  },
  conditions: {
    label: "使用边界",
    fields: [
      "useConditions",
      "nonUseConditions",
      "antiPatterns",
      "typicalProblems",
    ],
  },
  examples: {
    label: "例题",
    fields: ["examples"],
  },
  variables: {
    label: "变量说明",
    fields: ["variables"],
  },
  reviewItems: {
    label: "复习题",
    fields: ["reviewItems"],
  },
  relations: {
    label: "公式关系",
    fields: ["relations"],
  },
} satisfies Record<FormulaCompletionSection, SectionConfig>;

export async function generateFormulaFieldCompletion({
  variant,
  mode,
  target,
  formula,
  relationOptions = [],
}: {
  variant: FormulaFieldCompletionVariant;
  mode: FormulaFieldCompletionMode;
  target: FormulaCompletionSection;
  formula: FormulaFieldCompletionFormula;
  relationOptions?: FormulaFieldCompletionRelationOption[];
}): Promise<{ patch: FormulaCompletionPatch }> {
  const section = resolveSectionConfig(target);
  const content = await createChatCompletion({
    messages: [
      {
        role: "system",
        content: [
          "你是 FormulaLab 的公式内容板块补全助手。",
          "你一次只补全用户指定的一个板块，不能改写其他板块。",
          "面向中文学习者，内容要短、准、可直接进入间隔复习。",
          "LaTeX 只写表达式本体，不要包裹 $ 或 $$。",
          "如果上下文不足，请做保守补全，不要编造复杂背景。",
          '必须只返回严格 JSON object，格式为 { "patch": { ... } }。',
        ].join("\n"),
      },
      {
        role: "user",
        content: buildSectionCompletionPrompt({
          variant,
          mode,
          target,
          formula,
          section,
          relationOptions,
        }),
      },
    ],
    responseFormat: { type: "json_object" },
  });
  const patch = normalizeSectionCompletionPatch({
    target,
    rawPatch: parseFormulaFieldCompletionContent(content),
    formula,
    relationOptions,
  });

  return { patch };
}

export function normalizeSectionCompletionPatch({
  target,
  rawPatch,
  formula,
  relationOptions = [],
}: {
  target: FormulaCompletionSection;
  rawPatch: unknown;
  formula?: FormulaFieldCompletionFormula;
  relationOptions?: FormulaFieldCompletionRelationOption[];
}): FormulaCompletionPatch {
  const section = resolveSectionConfig(target);
  const record = toRecord(rawPatch);
  const patch: FormulaCompletionPatch = {};

  for (const field of section.fields) {
    if (!(field in record)) {
      continue;
    }

    const value = record[field];

    if (field === "slug") {
      const slug = normalizeSlug(toText(value));
      if (slug) patch.slug = slug;
    } else if (
      field === "title" ||
      field === "expressionLatex" ||
      field === "domain" ||
      field === "oneLineUse" ||
      field === "meaning"
    ) {
      const text = toText(value);
      if (text) patch[field] = text;
    } else if (
      field === "subdomain" ||
      field === "intuition" ||
      field === "derivation"
    ) {
      patch[field] = toNullableText(value);
    } else if (field === "memoryHook") {
      patch.memoryHook = toText(value);
    } else if (
      field === "useConditions" ||
      field === "nonUseConditions" ||
      field === "antiPatterns" ||
      field === "typicalProblems" ||
      field === "examples" ||
      field === "tags"
    ) {
      const list = toTextList(value);
      if (list.length > 0) patch[field] = list;
    } else if (field === "difficulty") {
      patch.difficulty = clampInteger(Number(toText(value) || value), 1, 5);
    } else if (field === "variables") {
      const variables = normalizeVariables(value);
      if (variables.length > 0) patch.variables = variables;
    } else if (field === "reviewItems") {
      const reviewItems = normalizeReviewItems(value);
      if (reviewItems.length > 0) patch.reviewItems = reviewItems;
    } else if (field === "relations") {
      const relations = normalizeRelations(value, relationOptions);
      patch.relations = relations;
    }
  }

  if (Object.keys(patch).length === 0) {
    throw new Error(`${section.label} 补全结果为空`);
  }

  return preserveRequiredDefaults(target, patch, formula);
}

export function parseFormulaFieldCompletionContent(content: string) {
  const parsed = parseJsonContent(content);

  if (!parsed || typeof parsed !== "object" || !("patch" in parsed)) {
    throw new Error('AI returned an invalid section completion: missing "patch"');
  }

  return (parsed as { patch: unknown }).patch;
}

export function resolveSectionConfig(target: string): SectionConfig {
  const section = SECTION_CONFIGS[target as FormulaCompletionSection];

  if (!section) {
    throw new Error(`Unsupported completion section: ${target}`);
  }

  return section;
}

function preserveRequiredDefaults(
  target: FormulaCompletionSection,
  patch: FormulaCompletionPatch,
  formula?: FormulaFieldCompletionFormula,
) {
  if (target === "basics" && formula?.slug && !patch.slug) {
    patch.slug = formula.slug;
  }

  return patch;
}

function buildSectionCompletionPrompt({
  variant,
  mode,
  target,
  formula,
  section,
  relationOptions,
}: {
  variant: FormulaFieldCompletionVariant;
  mode: FormulaFieldCompletionMode;
  target: FormulaCompletionSection;
  formula: FormulaFieldCompletionFormula;
  section: SectionConfig;
  relationOptions: FormulaFieldCompletionRelationOption[];
}) {
  return [
    "请补全下面公式表单中的一个板块。",
    "",
    `入口类型：${variant === "official" ? "官方公式维护" : "我的公式"}`,
    `编辑模式：${mode === "create" ? "新增" : "编辑"}`,
    `目标板块：${target}`,
    `目标板块含义：${section.label}`,
    `只能返回这些字段：${section.fields.join(", ")}`,
    "",
    "当前公式表单上下文：",
    JSON.stringify(formula, null, 2),
    "",
    relationOptions.length > 0
      ? [
          "可选关系目标公式：",
          JSON.stringify(relationOptions, null, 2),
        ].join("\n")
      : "可选关系目标公式：[]",
    "",
    "返回要求：",
    '- 只返回 JSON object：{ "patch": { ... } }。',
    "- patch 只能包含目标板块允许字段。",
    "- 文本字段是 string；可为空字段可返回空字符串。",
    "- 列表字段是 string[]，每条短句独立成项。",
    "- difficulty 是 1 到 5 的整数。",
    "- reviewItems[].type 必须是 recall、recognition、application 之一。",
    "- relations[].relationType 必须是 prerequisite、related、confusable、application_of 之一。",
    "- relations[].toSlug 必须使用可选关系目标公式中的 slug；如果没有合适目标，返回空 relations。",
    "- variables 必须补全 symbol、name、description，unit 可为 null。",
  ].join("\n");
}

function normalizeVariables(value: unknown): FormulaVariablePatch[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = toRecord(item);

      return {
        symbol: toText(record.symbol),
        name: toText(record.name),
        description: toText(record.description),
        unit: toNullableText(record.unit),
      };
    })
    .filter((item) => item.symbol && item.name && item.description);
}

function normalizeReviewItems(value: unknown): FormulaReviewItemPatch[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const reviewItems: FormulaReviewItemPatch[] = [];

  for (const item of value) {
    const record = toRecord(item);
    const type = toReviewItemType(record.type);

    if (!type) {
      continue;
    }

    const reviewItem: FormulaReviewItemPatch = {
        type,
        prompt: toText(record.prompt),
        answer: toText(record.answer),
        explanation: toNullableText(record.explanation),
        difficulty: clampInteger(
          Number(toText(record.difficulty) || record.difficulty),
          1,
          5,
        ),
    };

    if (reviewItem.prompt && reviewItem.answer) {
      reviewItems.push(reviewItem);
    }
  }

  return reviewItems;
}

function normalizeRelations(
  value: unknown,
  relationOptions: FormulaFieldCompletionRelationOption[],
): FormulaRelationPatch[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const allowedSlugs = new Set(relationOptions.map((item) => item.slug));

  const relations: FormulaRelationPatch[] = [];

  for (const item of value) {
    const record = toRecord(item);
    const toSlug = toText(record.toSlug);
    const relationType = toRelationType(record.relationType);

    if (!toSlug || !allowedSlugs.has(toSlug) || !relationType) {
      continue;
    }

    relations.push({
      toSlug,
      relationType,
      note: toNullableText(record.note),
    });
  }

  return relations;
}

function parseJsonContent(content: string) {
  const trimmed = content.trim();
  const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonText = fencedJson?.[1] ?? trimmed;
  return JSON.parse(jsonText) as unknown;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toText(value: unknown) {
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

function toNullableText(value: unknown) {
  return toText(value) || null;
}

function toTextList(value: unknown) {
  const items = Array.isArray(value)
    ? value.map(toText)
    : toText(value).split(/[\n,，]/);

  return items.map((item) => item.trim()).filter(Boolean);
}

function toReviewItemType(value: unknown): FormulaReviewItemPatch["type"] | null {
  const text = toText(value);

  return REVIEW_ITEM_TYPES.includes(text as FormulaReviewItemPatch["type"])
    ? (text as FormulaReviewItemPatch["type"])
    : null;
}

function toRelationType(value: unknown): FormulaRelationPatch["relationType"] | null {
  const text = toText(value);

  return RELATION_TYPES.includes(text as FormulaRelationPatch["relationType"])
    ? (text as FormulaRelationPatch["relationType"])
    : null;
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, Math.round(value)));
}
