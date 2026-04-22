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

export async function listFormulaMemoryHooks({
  formulaIdOrSlug,
  userId,
}: {
  formulaIdOrSlug: string;
  userId?: string;
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

  return prisma.formulaMemoryHook.findMany({
    where: {
      formulaId: formula.id,
      OR: [{ userId: null }, ...(userId ? [{ userId }] : [])],
    },
    orderBy: [{ userId: "desc" }, { helpfulCount: "desc" }, { createdAt: "asc" }],
  });
}

export async function createUserFormulaMemoryHook({
  formulaIdOrSlug,
  userId,
  content,
  prompt,
}: {
  formulaIdOrSlug: string;
  userId: string;
  content: string;
  prompt?: string;
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

  return prisma.formulaMemoryHook.create({
    data: {
      formulaId: formula.id,
      userId,
      source: "user_created",
      type: "personal",
      content,
      prompt,
    },
  });
}

export async function selectFormulaMemoryHook({
  formulaIdOrSlug,
  hookId,
  userId,
}: {
  formulaIdOrSlug: string;
  hookId: string;
  userId?: string;
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

  const hook = await prisma.formulaMemoryHook.findFirst({
    where: {
      id: hookId,
      formulaId: formula.id,
      OR: [{ userId: null }, ...(userId ? [{ userId }] : [])],
    },
  });

  if (!hook) {
    return null;
  }

  return prisma.formulaMemoryHook.update({
    where: {
      id: hook.id,
    },
    data: {
      helpfulCount: {
        increment: 1,
      },
      usedCount: {
        increment: 1,
      },
      lastUsedAt: new Date(),
    },
  });
}
