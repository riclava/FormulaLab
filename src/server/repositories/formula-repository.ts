import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

const formulaSummaryInclude = {
  _count: {
    select: {
      reviewItems: true,
      memoryHooks: true,
    },
  },
} satisfies Prisma.FormulaInclude;

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
      userId: null,
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
  query,
}: {
  domain?: string;
  query?: string;
} = {}) {
  return prisma.formula.findMany({
    where: {
      ...(domain ? { domain } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" as const } },
              { oneLineUse: { contains: query, mode: "insensitive" as const } },
              { tags: { has: query } },
            ],
          }
        : {}),
    },
    include: formulaSummaryInclude,
    orderBy: [{ domain: "asc" }, { difficulty: "asc" }, { title: "asc" }],
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
        include: formulaSummaryInclude,
      },
    },
    orderBy: [{ relationType: "asc" }, { createdAt: "asc" }],
  });
}
