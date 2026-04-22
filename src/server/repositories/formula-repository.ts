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
    orderBy: [
      { userId: "desc" },
      { helpfulCount: "desc" },
      { usedCount: "desc" },
      { lastUsedAt: "desc" },
      { createdAt: "asc" },
    ],
  });
}

export async function createUserFormulaMemoryHook({
  formulaIdOrSlug,
  userId,
  content,
  prompt,
  type = "personal",
}: {
  formulaIdOrSlug: string;
  userId: string;
  content: string;
  prompt?: string;
  type?: "analogy" | "scenario" | "visual" | "mnemonic" | "contrast" | "personal";
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
      type,
      content,
      prompt,
    },
  });
}

export async function createAiFormulaMemoryHooks({
  formulaIdOrSlug,
  hooks,
}: {
  formulaIdOrSlug: string;
  hooks: Array<{
    type: "analogy" | "scenario" | "visual" | "mnemonic" | "contrast" | "personal";
    content: string;
    prompt?: string;
  }>;
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

  const createdHooks = await Promise.all(
    hooks.map((hook) =>
      prisma.formulaMemoryHook.create({
        data: {
          formulaId: formula.id,
          source: "ai_suggested",
          type: hook.type,
          content: hook.content,
          prompt: hook.prompt,
        },
      }),
    ),
  );

  return createdHooks;
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
      OR: [{ userId: null }, ...(userId ? [{ userId }] : [])],
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

export async function updateUserFormulaMemoryHook({
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
  type?: "analogy" | "scenario" | "visual" | "mnemonic" | "contrast" | "personal";
}) {
  const hook = await prisma.formulaMemoryHook.findFirst({
    where: {
      id: hookId,
      userId,
      source: "user_created",
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
      ...(content !== undefined ? { content } : {}),
      ...(prompt !== undefined ? { prompt } : {}),
      ...(type !== undefined ? { type } : {}),
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
      source: "user_created",
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

export async function markMemoryHookUsed({
  hookId,
  userId,
}: {
  hookId: string;
  userId?: string;
}) {
  const hook = await getFormulaMemoryHookById({
    hookId,
    userId,
  });

  if (!hook) {
    return null;
  }

  return prisma.formulaMemoryHook.update({
    where: {
      id: hook.id,
    },
    data: {
      usedCount: {
        increment: 1,
      },
      lastUsedAt: new Date(),
    },
  });
}

export async function markMemoryHookHelpful({
  hookId,
  userId,
}: {
  hookId: string;
  userId?: string;
}) {
  const hook = await getFormulaMemoryHookById({
    hookId,
    userId,
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
    },
  });
}
