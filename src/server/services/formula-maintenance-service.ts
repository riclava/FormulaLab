import {
  listOfficialFormulaMaintenanceFacets,
  listOfficialFormulaMaintenanceItems,
} from "@/server/repositories/formula-repository";
import { prisma } from "@/lib/db/prisma";
import {
  FormulaRelationType,
  Prisma,
  ReviewItemType,
} from "@/generated/prisma/client";

type OfficialFormulaMaintenanceRow = Awaited<
  ReturnType<typeof listOfficialFormulaMaintenanceItems>
>[number];

export type FormulaContentQuality = {
  status: "complete" | "incomplete";
  missingItems: string[];
};

export type OfficialFormulaMaintenanceItem = {
  id: string;
  slug: string;
  title: string;
  expressionLatex: string;
  domain: string;
  subdomain: string | null;
  difficulty: number;
  tags: string[];
  updatedAt: string;
  variableCount: number;
  reviewItemCount: number;
  quality: FormulaContentQuality;
};

export type OfficialFormulaVariableInput = {
  symbol: string;
  name: string;
  description: string;
  unit?: string | null;
};

export type OfficialFormulaReviewItemInput = {
  type: "recall" | "recognition" | "application";
  prompt: string;
  answer: string;
  explanation?: string | null;
  difficulty: number;
};

export type OfficialFormulaRelationInput = {
  toSlug: string;
  relationType: "prerequisite" | "related" | "confusable" | "application_of";
  note?: string | null;
};

export type OfficialFormulaInput = {
  slug?: string;
  title: string;
  expressionLatex: string;
  domain: string;
  subdomain?: string | null;
  oneLineUse: string;
  meaning: string;
  intuition?: string | null;
  derivation?: string | null;
  useConditions: string[];
  nonUseConditions: string[];
  antiPatterns: string[];
  typicalProblems: string[];
  examples: string[];
  plotConfig?: unknown;
  difficulty: number;
  tags: string[];
  variables: OfficialFormulaVariableInput[];
  reviewItems: OfficialFormulaReviewItemInput[];
  relations: OfficialFormulaRelationInput[];
};

export type OfficialFormulaExportItem = Required<
  Omit<OfficialFormulaInput, "slug" | "subdomain" | "intuition" | "derivation" | "plotConfig">
> & {
  slug: string;
  subdomain: string | null;
  intuition: string | null;
  derivation: string | null;
  plotConfig: Prisma.JsonValue | null;
};

export async function getOfficialFormulaMaintenanceCatalog(params?: {
  domain?: string;
  difficulty?: number;
  query?: string;
}) {
  const [rows, facetRows] = await Promise.all([
    listOfficialFormulaMaintenanceItems(params),
    listOfficialFormulaMaintenanceFacets(),
  ]);

  const items = rows
    .map(toMaintenanceItem)
    .sort((left, right) => {
      if (right.quality.missingItems.length !== left.quality.missingItems.length) {
        return right.quality.missingItems.length - left.quality.missingItems.length;
      }

      if (left.domain !== right.domain) {
        return left.domain.localeCompare(right.domain, "zh-CN");
      }

      if (left.difficulty !== right.difficulty) {
        return left.difficulty - right.difficulty;
      }

      return left.title.localeCompare(right.title, "zh-CN");
    });

  return {
    items,
    filters: {
      domains: Array.from(new Set(facetRows.map((row) => row.domain))),
      difficulties: Array.from(
        new Set(facetRows.map((row) => row.difficulty)),
      ).sort((left, right) => left - right),
    },
  };
}

export async function getOfficialFormulaMaintenanceDetail(slug: string) {
  const formula = await prisma.formula.findFirst({
    where: {
      slug,
      ownerUserId: null,
    },
    include: {
      variables: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      reviewItems: {
        orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
      },
      outgoingRelations: {
        include: {
          toFormula: {
            select: {
              slug: true,
            },
          },
        },
        orderBy: [{ relationType: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!formula) {
    return null;
  }

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
    relations: formula.outgoingRelations.map((relation) => ({
      toSlug: relation.toFormula.slug,
      relationType: relation.relationType,
      note: relation.note,
    })),
  } satisfies OfficialFormulaExportItem;
}

export async function createOfficialFormula(input: OfficialFormulaInput) {
  const normalized = normalizeOfficialFormulaInput(input, "create");

  return prisma.$transaction(async (tx) => {
    const existing = await tx.formula.findUnique({
      where: {
        slug: normalized.slug,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new Error(`slug already exists: ${normalized.slug}`);
    }

    const formula = await tx.formula.create({
      data: {
        ownerUserId: null,
        slug: normalized.slug,
        title: normalized.title,
        expressionLatex: normalized.expressionLatex,
        domain: normalized.domain,
        subdomain: normalized.subdomain,
        oneLineUse: normalized.oneLineUse,
        meaning: normalized.meaning,
        intuition: normalized.intuition,
        derivation: normalized.derivation,
        useConditions: normalized.useConditions,
        nonUseConditions: normalized.nonUseConditions,
        antiPatterns: normalized.antiPatterns,
        typicalProblems: normalized.typicalProblems,
        examples: normalized.examples,
        ...(normalized.plotConfig === null
          ? {}
          : { plotConfig: normalized.plotConfig }),
        difficulty: normalized.difficulty,
        tags: normalized.tags,
        variables: {
          create: normalized.variables.map((variable, index) => ({
            ...variable,
            unit: variable.unit ?? null,
            sortOrder: index,
          })),
        },
        reviewItems: {
          create: normalized.reviewItems,
        },
      },
      select: {
        slug: true,
      },
    });

    await createOfficialFormulaRelations(tx, formula.slug, normalized.relations);

    return formula;
  });
}

export async function updateOfficialFormula(
  currentSlug: string,
  input: OfficialFormulaInput,
) {
  const normalized = normalizeOfficialFormulaInput(input, "update");

  return prisma.$transaction(async (tx) => {
    const existing = await tx.formula.findFirst({
      where: {
        slug: currentSlug,
        ownerUserId: null,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return null;
    }

    if (normalized.slug !== currentSlug) {
      const conflict = await tx.formula.findUnique({
        where: {
          slug: normalized.slug,
        },
        select: {
          id: true,
        },
      });

      if (conflict) {
        throw new Error(`slug already exists: ${normalized.slug}`);
      }
    }

    await tx.formulaRelation.deleteMany({
      where: {
        fromFormulaId: existing.id,
      },
    });
    await tx.formulaVariable.deleteMany({
      where: {
        formulaId: existing.id,
      },
    });
    await tx.reviewItem.deleteMany({
      where: {
        formulaId: existing.id,
      },
    });

    const formula = await tx.formula.update({
      where: {
        id: existing.id,
      },
      data: {
        slug: normalized.slug,
        title: normalized.title,
        expressionLatex: normalized.expressionLatex,
        domain: normalized.domain,
        subdomain: normalized.subdomain,
        oneLineUse: normalized.oneLineUse,
        meaning: normalized.meaning,
        intuition: normalized.intuition,
        derivation: normalized.derivation,
        useConditions: normalized.useConditions,
        nonUseConditions: normalized.nonUseConditions,
        antiPatterns: normalized.antiPatterns,
        typicalProblems: normalized.typicalProblems,
        examples: normalized.examples,
        plotConfig:
          normalized.plotConfig === null ? Prisma.JsonNull : normalized.plotConfig,
        difficulty: normalized.difficulty,
        tags: normalized.tags,
        variables: {
          create: normalized.variables.map((variable, index) => ({
            ...variable,
            unit: variable.unit ?? null,
            sortOrder: index,
          })),
        },
        reviewItems: {
          create: normalized.reviewItems,
        },
      },
      select: {
        slug: true,
      },
    });

    await createOfficialFormulaRelations(tx, formula.slug, normalized.relations);

    return formula;
  });
}

export async function deleteOfficialFormula(slug: string) {
  const existing = await prisma.formula.findFirst({
    where: {
      slug,
      ownerUserId: null,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return null;
  }

  await prisma.formula.delete({
    where: {
      id: existing.id,
    },
  });

  return {
    deleted: true,
  };
}

export async function exportOfficialFormulaLibrary() {
  const formulas = await prisma.formula.findMany({
    where: {
      ownerUserId: null,
    },
    include: {
      variables: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      reviewItems: {
        orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
      },
      outgoingRelations: {
        include: {
          toFormula: {
            select: {
              slug: true,
            },
          },
        },
        orderBy: [{ relationType: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: [{ domain: "asc" }, { difficulty: "asc" }, { title: "asc" }],
  });

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    formulas: formulas.map((formula) => ({
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
      relations: formula.outgoingRelations.map((relation) => ({
        toSlug: relation.toFormula.slug,
        relationType: relation.relationType,
        note: relation.note,
      })),
    })),
  };
}

export async function importOfficialFormulaLibrary({
  formulas,
  dryRun,
}: {
  formulas: OfficialFormulaInput[];
  dryRun: boolean;
}) {
  const normalized = formulas.map((formula) =>
    normalizeOfficialFormulaInput(formula, "import"),
  );
  const slugs = new Set<string>();
  const errors: string[] = [];

  for (const formula of normalized) {
    if (slugs.has(formula.slug)) {
      errors.push(`重复 slug: ${formula.slug}`);
    }
    slugs.add(formula.slug);
  }

  const allOfficialSlugs = new Set(
    (
      await prisma.formula.findMany({
        where: {
          ownerUserId: null,
        },
        select: {
          slug: true,
        },
      })
    ).map((formula) => formula.slug),
  );
  const importSlugs = new Set(normalized.map((formula) => formula.slug));
  const existingImportSlugs = new Set(
    normalized
      .map((formula) => formula.slug)
      .filter((slug) => allOfficialSlugs.has(slug)),
  );
  const createSlugs = normalized
    .map((formula) => formula.slug)
    .filter((slug) => !existingImportSlugs.has(slug));
  const updateSlugs = normalized
    .map((formula) => formula.slug)
    .filter((slug) => existingImportSlugs.has(slug));

  for (const formula of normalized) {
    for (const relation of formula.relations) {
      if (
        relation.toSlug !== formula.slug &&
        !allOfficialSlugs.has(relation.toSlug) &&
        !importSlugs.has(relation.toSlug)
      ) {
        errors.push(`${formula.slug} 的关系目标不存在: ${relation.toSlug}`);
      }
    }
  }

  if (errors.length > 0) {
    return {
      ok: false,
      dryRun,
      errors,
      upsertCount: 0,
      createCount: 0,
      updateCount: 0,
      createSlugs: [],
      updateSlugs: [],
    };
  }

  if (dryRun) {
    return {
      ok: true,
      dryRun,
      errors,
      upsertCount: normalized.length,
      createCount: createSlugs.length,
      updateCount: updateSlugs.length,
      createSlugs,
      updateSlugs,
    };
  }

  for (const formula of normalized) {
    const existing = await prisma.formula.findFirst({
      where: {
        slug: formula.slug,
        ownerUserId: null,
      },
      select: {
        slug: true,
      },
    });

    if (existing) {
      await updateOfficialFormula(formula.slug, {
        ...formula,
        relations: [],
      });
    } else {
      await createOfficialFormula({
        ...formula,
        relations: [],
      });
    }
  }

  for (const formula of normalized) {
    await updateOfficialFormula(formula.slug, formula);
  }

  return {
    ok: true,
    dryRun,
    errors,
    upsertCount: normalized.length,
    createCount: createSlugs.length,
    updateCount: updateSlugs.length,
    createSlugs,
    updateSlugs,
  };
}

export function evaluateFormulaContentQuality(
  formula: Pick<
    OfficialFormulaMaintenanceRow,
    | "oneLineUse"
    | "meaning"
    | "useConditions"
    | "antiPatterns"
    | "typicalProblems"
    | "variables"
    | "reviewItems"
  >,
): FormulaContentQuality {
  const missingItems: string[] = [];

  if (!formula.oneLineUse.trim()) {
    missingItems.push("一句话用途");
  }

  if (!formula.meaning.trim()) {
    missingItems.push("意义说明");
  }

  if (!hasTextListContent(formula.useConditions)) {
    missingItems.push("适用条件");
  }

  if (!hasTextListContent(formula.antiPatterns)) {
    missingItems.push("误用提醒");
  }

  if (!hasTextListContent(formula.typicalProblems)) {
    missingItems.push("典型题型");
  }

  if (formula.variables.length === 0) {
    missingItems.push("变量说明");
  } else if (
    formula.variables.some(
      (variable) =>
        !variable.symbol.trim() ||
        !variable.name.trim() ||
        !variable.description.trim(),
    )
  ) {
    missingItems.push("变量说明完整性");
  }

  const reviewTypes = new Set(formula.reviewItems.map((item) => item.type));

  for (const type of ["recall", "recognition", "application"] as const) {
    if (!reviewTypes.has(type)) {
      missingItems.push(`${getReviewTypeLabel(type)}题`);
    }
  }

  return {
    status: missingItems.length === 0 ? "complete" : "incomplete",
    missingItems,
  };
}

function toMaintenanceItem(
  row: OfficialFormulaMaintenanceRow,
): OfficialFormulaMaintenanceItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    expressionLatex: row.expressionLatex,
    domain: row.domain,
    subdomain: row.subdomain,
    difficulty: row.difficulty,
    tags: row.tags,
    updatedAt: row.updatedAt.toISOString(),
    variableCount: row.variables.length,
    reviewItemCount: row.reviewItems.length,
    quality: evaluateFormulaContentQuality(row),
  };
}

function normalizeOfficialFormulaInput(
  input: OfficialFormulaInput,
  mode: "create" | "update" | "import",
) {
  const title = requiredString(input.title, "标题");
  const expressionLatex = requiredString(input.expressionLatex, "LaTeX 表达式");
  const oneLineUse = requiredString(input.oneLineUse, "一句话用途");
  const meaning = input.meaning?.trim() || oneLineUse;
  const domain = input.domain?.trim() || "未分类";
  const slug = normalizeSlug(input.slug || slugify(title));
  const difficulty = clampInteger(input.difficulty ?? 2, 1, 5);
  const variables = normalizeVariables(input.variables);
  const reviewItems = normalizeReviewItems(input.reviewItems, {
    title,
    expressionLatex,
    oneLineUse,
    meaning,
    difficulty,
  });

  if (!slug) {
    throw new Error(`${mode}: slug is required`);
  }

  return {
    slug,
    title,
    expressionLatex,
    domain,
    subdomain: nullableString(input.subdomain),
    oneLineUse,
    meaning,
    intuition: nullableString(input.intuition),
    derivation: nullableString(input.derivation),
    useConditions: normalizeTextList(input.useConditions, [
      "题目条件与公式变量可以一一对应。",
    ]),
    nonUseConditions: normalizeTextList(input.nonUseConditions, [
      "变量含义或前提条件无法确认时不要直接套用。",
    ]),
    antiPatterns: normalizeTextList(input.antiPatterns, [
      "只记表达式但没有确认适用条件。",
    ]),
    typicalProblems: normalizeTextList(input.typicalProblems, [
      `${title} 的基础识别和代入题。`,
    ]),
    examples: normalizeTextList(input.examples, [
      `看到题目要求“${oneLineUse}”时，先判断是否可以使用 ${title}。`,
    ]),
    plotConfig: toInputJson(input.plotConfig),
    difficulty,
    tags: normalizeTextList(input.tags, ["official"]),
    variables,
    reviewItems,
    relations: normalizeRelations(input.relations),
  };
}

function normalizeVariables(variables: OfficialFormulaVariableInput[] | undefined) {
  return (variables ?? [])
    .map((variable) => ({
      symbol: variable.symbol?.trim() ?? "",
      name: variable.name?.trim() ?? "",
      description: variable.description?.trim() ?? "",
      unit: nullableString(variable.unit),
    }))
    .filter((variable) => variable.symbol && variable.name && variable.description);
}

function normalizeReviewItems(
  reviewItems: OfficialFormulaReviewItemInput[] | undefined,
  fallback: {
    title: string;
    expressionLatex: string;
    oneLineUse: string;
    meaning: string;
    difficulty: number;
  },
) {
  const items = (reviewItems ?? [])
    .map((item) => ({
      type: item.type,
      prompt: item.prompt?.trim() ?? "",
      answer: item.answer?.trim() ?? "",
      explanation: nullableString(item.explanation),
      difficulty: clampInteger(item.difficulty ?? fallback.difficulty, 1, 5),
    }))
    .filter(
      (item) =>
        isReviewItemType(item.type) &&
        item.prompt.length > 0 &&
        item.answer.length > 0,
    );
  const existingTypes = new Set(items.map((item) => item.type));

  if (!existingTypes.has("recall")) {
    items.push({
      type: "recall",
      prompt: `写出「${fallback.title}」的公式表达式。`,
      answer: fallback.expressionLatex,
      explanation: fallback.oneLineUse,
      difficulty: Math.max(1, fallback.difficulty - 1),
    });
  }

  if (!existingTypes.has("recognition")) {
    items.push({
      type: "recognition",
      prompt: `题目要求“${fallback.oneLineUse}”时，应优先想到哪条公式？`,
      answer: fallback.title,
      explanation: `这是 ${fallback.title} 的典型使用场景。`,
      difficulty: fallback.difficulty,
    });
  }

  if (!existingTypes.has("application")) {
    items.push({
      type: "application",
      prompt: `请根据「${fallback.title}」设计一个代入小题。`,
      answer: `先确认适用条件，再代入 ${fallback.title}。`,
      explanation: fallback.meaning,
      difficulty: Math.min(5, fallback.difficulty + 1),
    });
  }

  return items.map((item) => ({
    type: item.type as ReviewItemType,
    prompt: item.prompt,
    answer: item.answer,
    explanation: item.explanation,
    difficulty: item.difficulty,
  }));
}

function normalizeRelations(relations: OfficialFormulaRelationInput[] | undefined) {
  return (relations ?? [])
    .map((relation) => ({
      toSlug: relation.toSlug?.trim() ?? "",
      relationType: relation.relationType,
      note: nullableString(relation.note),
    }))
    .filter(
      (relation) =>
        relation.toSlug.length > 0 && isFormulaRelationType(relation.relationType),
    )
    .map((relation) => ({
      toSlug: relation.toSlug,
      relationType: relation.relationType as FormulaRelationType,
      note: relation.note,
    }));
}

async function createOfficialFormulaRelations(
  tx: Prisma.TransactionClient,
  fromSlug: string,
  relations: ReturnType<typeof normalizeRelations>,
) {
  if (relations.length === 0) {
    return;
  }

  const fromFormula = await tx.formula.findUnique({
    where: {
      slug: fromSlug,
    },
    select: {
      id: true,
    },
  });

  if (!fromFormula) {
    throw new Error(`formula not found: ${fromSlug}`);
  }

  for (const relation of relations) {
    const toFormula = await tx.formula.findFirst({
      where: {
        slug: relation.toSlug,
        ownerUserId: null,
      },
      select: {
        id: true,
      },
    });

    if (!toFormula || toFormula.id === fromFormula.id) {
      continue;
    }

    await tx.formulaRelation.upsert({
      where: {
        fromFormulaId_toFormulaId_relationType: {
          fromFormulaId: fromFormula.id,
          toFormulaId: toFormula.id,
          relationType: relation.relationType,
        },
      },
      create: {
        fromFormulaId: fromFormula.id,
        toFormulaId: toFormula.id,
        relationType: relation.relationType,
        note: relation.note,
      },
      update: {
        note: relation.note,
      },
    });
  }
}

function requiredString(value: string | undefined, label: string) {
  const normalized = value?.trim() ?? "";

  if (!normalized) {
    throw new Error(`${label}不能为空`);
  }

  return normalized;
}

function nullableString(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";

  return normalized || null;
}

function normalizeTextList(value: string[] | undefined, fallback: string[]) {
  const normalized = (value ?? [])
    .map((item) => item.trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : fallback;
}

function clampInteger(value: number, min: number, max: number) {
  const integer = Number.isFinite(value) ? Math.round(value) : min;

  return Math.min(max, Math.max(min, integer));
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugify(value: string) {
  return normalizeSlug(value.replace(/[\u4e00-\u9fa5]/g, ""));
}

function toInputJson(value: unknown): Prisma.InputJsonValue | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return value as Prisma.InputJsonValue;
}

function isReviewItemType(value: unknown): value is ReviewItemType {
  return (
    value === ReviewItemType.recall ||
    value === ReviewItemType.recognition ||
    value === ReviewItemType.application
  );
}

function isFormulaRelationType(value: unknown): value is FormulaRelationType {
  return (
    value === FormulaRelationType.prerequisite ||
    value === FormulaRelationType.related ||
    value === FormulaRelationType.confusable ||
    value === FormulaRelationType.application_of
  );
}

function hasTextListContent(items: string[]) {
  return items.some((item) => item.trim().length > 0);
}

function getReviewTypeLabel(type: "recall" | "recognition" | "application") {
  if (type === "recall") {
    return "回忆";
  }

  if (type === "recognition") {
    return "识别";
  }

  return "应用";
}
