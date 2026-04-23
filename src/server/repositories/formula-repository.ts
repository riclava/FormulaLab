import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { ReviewItemType } from "@/generated/prisma/client";

function buildFormulaSummaryInclude(userId?: string) {
  return {
    variables: {
      orderBy: {
        sortOrder: "asc" as const,
      },
      select: {
        symbol: true,
        name: true,
      },
    },
    userStates: {
      where: {
        userId: userId ?? "__anonymous_formula_catalog__",
      },
      take: 1,
      select: {
        nextReviewAt: true,
        memoryStrength: true,
        lapseCount: true,
        consecutiveCorrect: true,
        totalReviews: true,
        correctReviews: true,
      },
    },
    memoryHooks: {
      where: {
        userId: userId ?? "__anonymous_formula_catalog__",
      },
      take: 1,
      select: {
        id: true,
      },
    },
    _count: {
      select: {
        reviewItems: true,
        memoryHooks: true,
      },
    },
  } satisfies Prisma.FormulaInclude;
}

const formulaDetailInclude = {
  variables: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
  reviewItems: {
    orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
  },
  memoryHooks: {
    where: {
      userId: "__formula_detail_without_learner__",
    },
    orderBy: {
      createdAt: "asc" as const,
    },
  },
  _count: {
    select: {
      reviewItems: true,
      memoryHooks: true,
    },
  },
} satisfies Prisma.FormulaInclude;

export async function listFormulas({
  domain,
  tag,
  difficulty,
  query,
  userId,
}: {
  domain?: string;
  tag?: string;
  difficulty?: number;
  query?: string;
  userId?: string;
} = {}) {
  const normalizedQuery = query?.trim();
  const queryTokens = normalizedQuery
    ? normalizedQuery.split(/\s+/).filter(Boolean)
    : [];

  return prisma.formula.findMany({
    where: {
      ...(domain ? { domain } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
      ...(typeof difficulty === "number" ? { difficulty } : {}),
      ...(normalizedQuery
        ? {
            OR: [
              {
                title: {
                  contains: normalizedQuery,
                  mode: "insensitive" as const,
                },
              },
              {
                oneLineUse: {
                  contains: normalizedQuery,
                  mode: "insensitive" as const,
                },
              },
              {
                meaning: {
                  contains: normalizedQuery,
                  mode: "insensitive" as const,
                },
              },
              {
                subdomain: {
                  contains: normalizedQuery,
                  mode: "insensitive" as const,
                },
              },
              {
                variables: {
                  some: {
                    OR: [
                      {
                        symbol: {
                          contains: normalizedQuery,
                          mode: "insensitive" as const,
                        },
                      },
                      {
                        name: {
                          contains: normalizedQuery,
                          mode: "insensitive" as const,
                        },
                      },
                      {
                        description: {
                          contains: normalizedQuery,
                          mode: "insensitive" as const,
                        },
                      },
                    ],
                  },
                },
              },
              ...(queryTokens.length > 0 ? [{ tags: { hasSome: queryTokens } }] : []),
            ],
          }
        : {}),
    },
    include: buildFormulaSummaryInclude(userId),
    orderBy: [{ domain: "asc" }, { difficulty: "asc" }, { title: "asc" }],
  });
}

export async function listFormulaCatalogFacets() {
  return prisma.formula.findMany({
    select: {
      domain: true,
      difficulty: true,
      tags: true,
    },
    orderBy: [{ domain: "asc" }, { difficulty: "asc" }, { title: "asc" }],
  });
}

export async function createCustomFormula({
  userId,
  input,
}: {
  userId: string;
  input: {
    slug: string;
    title: string;
    expressionLatex: string;
    domain: string;
    subdomain?: string | null;
    oneLineUse: string;
    meaning: string;
    derivation?: string | null;
    useConditions: string[];
    nonUseConditions: string[];
    antiPatterns: string[];
    typicalProblems: string[];
    examples: string[];
    difficulty: number;
    tags: string[];
    reviewItems: Array<{
      type: ReviewItemType;
      prompt: string;
      answer: string;
      explanation?: string | null;
      difficulty: number;
    }>;
    memoryHooks: Array<{
      content: string;
    }>;
  };
}) {
  return prisma.$transaction(async (tx) => {
    const formula = await tx.formula.create({
      data: {
        slug: input.slug,
        title: input.title,
        expressionLatex: input.expressionLatex,
        domain: input.domain,
        subdomain: input.subdomain,
        oneLineUse: input.oneLineUse,
        meaning: input.meaning,
        intuition: null,
        derivation: input.derivation,
        useConditions: input.useConditions,
        nonUseConditions: input.nonUseConditions,
        antiPatterns: input.antiPatterns,
        typicalProblems: input.typicalProblems,
        examples: input.examples,
        difficulty: input.difficulty,
        tags: Array.from(new Set(["user-created", ...input.tags])),
        reviewItems: {
          create: input.reviewItems,
        },
      },
    });

    if (input.memoryHooks.length) {
      await tx.formulaMemoryHook.create({
        data: {
          formulaId: formula.id,
          userId,
          content: input.memoryHooks[0].content,
        },
      });
    }

    await tx.userFormulaState.create({
      data: {
        userId,
        formulaId: formula.id,
        memoryStrength: 0.1,
        stability: 0,
        difficultyEstimate: input.difficulty,
        nextReviewAt: new Date(),
      },
    });

    return formula;
  });
}

export async function getFormulaByIdOrSlug(idOrSlug: string) {
  return prisma.formula.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: formulaDetailInclude,
  });
}

export async function listFormulaRelations(idOrSlug: string) {
  const formula = await prisma.formula.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    select: {
      id: true,
    },
  });

  if (!formula) {
    return null;
  }

  return prisma.formulaRelation.findMany({
    where: {
      fromFormulaId: formula.id,
    },
    include: {
      toFormula: {
        include: buildFormulaSummaryInclude(),
      },
    },
    orderBy: [{ relationType: "asc" }, { createdAt: "asc" }],
  });
}

export async function listFormulaMemoryHooks({
  formulaIdOrSlug,
  userId,
}: {
  formulaIdOrSlug: string;
  userId?: string;
}) {
  if (!userId) {
    return [];
  }

  const formula = await prisma.formula.findFirst({
    where: {
      OR: [{ id: formulaIdOrSlug }, { slug: formulaIdOrSlug }],
    },
    select: {
      id: true,
    },
  });

  if (!formula) {
    return null;
  }

  return prisma.formulaMemoryHook.findMany({
    where: {
      formulaId: formula.id,
      userId,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function saveUserFormulaMemoryHook({
  formulaIdOrSlug,
  userId,
  content,
}: {
  formulaIdOrSlug: string;
  userId: string;
  content: string;
}) {
  const formula = await prisma.formula.findFirst({
    where: {
      OR: [{ id: formulaIdOrSlug }, { slug: formulaIdOrSlug }],
    },
    select: {
      id: true,
    },
  });

  if (!formula) {
    return null;
  }

  return prisma.formulaMemoryHook.upsert({
    where: {
      userId_formulaId: {
        userId,
        formulaId: formula.id,
      },
    },
    create: {
      formulaId: formula.id,
      userId,
      content,
    },
    update: {
      content,
    },
  });
}

export async function getFormulaMemoryHookById({
  hookId,
  userId,
}: {
  hookId: string;
  userId?: string;
}) {
  return prisma.formulaMemoryHook.findFirst({
    where: {
      id: hookId,
      ...(userId ? { userId } : {}),
    },
    include: {
      formula: {
        select: {
          id: true,
          slug: true,
          title: true,
          domain: true,
        },
      },
    },
  });
}

export async function deleteUserFormulaMemoryHook({
  hookId,
  userId,
}: {
  hookId: string;
  userId: string;
}) {
  const hook = await prisma.formulaMemoryHook.findFirst({
    where: {
      id: hookId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!hook) {
    return null;
  }

  await prisma.formulaMemoryHook.delete({
    where: {
      id: hook.id,
    },
  });

  return hook;
}
