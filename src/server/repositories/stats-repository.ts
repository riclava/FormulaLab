import { prisma } from "@/lib/db/prisma";

export async function getLatestCompletedStudySessionSummary(userId: string) {
  return prisma.studySession.findFirst({
    where: {
      userId,
      status: "completed",
    },
    orderBy: {
      completedAt: "desc",
    },
    include: {
      reviewLogs: {
        include: {
          formula: {
            select: {
              id: true,
              slug: true,
              title: true,
              domain: true,
              oneLineUse: true,
            },
          },
          memoryHookUsed: {
            select: {
              id: true,
              content: true,
              helpfulCount: true,
            },
          },
        },
      },
    },
  });
}

export async function listRecentStudySessions(userId: string, take = 60) {
  return prisma.studySession.findMany({
    where: {
      userId,
    },
    orderBy: {
      startedAt: "desc",
    },
    take,
  });
}

export async function listReviewLogsForUser(userId: string, take = 500) {
  return prisma.reviewLog.findMany({
    where: {
      userId,
    },
    orderBy: {
      reviewedAt: "asc",
    },
    take,
  });
}

export async function listWeakFormulaStates(userId: string, take = 8) {
  return prisma.userFormulaState.findMany({
    where: {
      userId,
    },
    include: {
      formula: {
        include: {
          _count: {
            select: {
              memoryHooks: true,
            },
          },
        },
      },
    },
    orderBy: [
      { nextReviewAt: "asc" },
      { memoryStrength: "asc" },
      { lapseCount: "desc" },
      { difficultyEstimate: "desc" },
    ],
    take,
  });
}

export async function countProgressBuckets(userId: string) {
  const now = new Date();

  const [
    trackedFormulaCount,
    dueNowCount,
    scheduledCount,
    stableCount,
    weakCount,
    memoryHookFormulaRows,
    latestDiagnostic,
  ] = await Promise.all([
    prisma.userFormulaState.count({
      where: { userId },
    }),
    prisma.userFormulaState.count({
      where: {
        userId,
        nextReviewAt: {
          lte: now,
        },
      },
    }),
    prisma.userFormulaState.count({
      where: {
        userId,
        nextReviewAt: {
          gt: now,
        },
      },
    }),
    prisma.userFormulaState.count({
      where: {
        userId,
        memoryStrength: {
          gte: 0.7,
        },
        consecutiveCorrect: {
          gte: 3,
        },
      },
    }),
    prisma.userFormulaState.count({
      where: {
        userId,
        OR: [
          {
            memoryStrength: {
              lt: 0.4,
            },
          },
          {
            lapseCount: {
              gt: 0,
            },
          },
        ],
      },
    }),
    prisma.formulaMemoryHook.findMany({
      where: {
        userId,
      },
      distinct: ["formulaId"],
      select: {
        formulaId: true,
      },
    }),
    prisma.diagnosticAttempt.findFirst({
      where: {
        userId,
      },
      orderBy: {
        completedAt: "desc",
      },
      select: {
        completedAt: true,
      },
    }),
  ]);

  return {
    trackedFormulaCount,
    dueNowCount,
    scheduledCount,
    stableCount,
    weakCount,
    memoryHookFormulaCount: memoryHookFormulaRows.length,
    latestDiagnosticAt: latestDiagnostic?.completedAt ?? null,
  };
}

export async function listRecentMemoryHookActivity({
  userId,
  from,
  formulaIds,
}: {
  userId: string;
  from: Date;
  formulaIds: string[];
}) {
  const [createdHooks, usedHooks] = await Promise.all([
    prisma.formulaMemoryHook.findMany({
      where: {
        userId,
        createdAt: {
          gte: from,
        },
      },
      include: {
        formula: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
    prisma.reviewLog.findMany({
      where: {
        userId,
        reviewedAt: {
          gte: from,
        },
        memoryHookUsedId: {
          not: null,
        },
        formulaId: {
          in: formulaIds,
        },
      },
      include: {
        formula: {
          select: {
            id: true,
            title: true,
          },
        },
        memoryHookUsed: {
          select: {
            id: true,
            content: true,
            helpfulCount: true,
          },
        },
      },
      orderBy: {
        reviewedAt: "desc",
      },
      take: 10,
    }),
  ]);

  return {
    createdHooks,
    usedHooks,
  };
}

export async function listAccessibleMemoryHooks(userId: string) {
  return prisma.formulaMemoryHook.findMany({
    where: {
      OR: [
        { userId },
        {
          userId: null,
          formula: {
            userStates: {
              some: {
                userId,
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      source: true,
      usedCount: true,
      helpfulCount: true,
    },
  });
}

export async function listProductEvents(userId: string) {
  return prisma.productEvent.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 500,
  });
}

export async function createProductEvents({
  userId,
  events,
}: {
  userId: string;
  events: Array<{
    formulaId?: string;
    studySessionId?: string;
    type: "weak_formula_impression" | "weak_formula_opened";
  }>;
}) {
  if (events.length === 0) {
    return;
  }

  await prisma.productEvent.createMany({
    data: events.map((event) => ({
      userId,
      formulaId: event.formulaId,
      studySessionId: event.studySessionId,
      type: event.type,
    })),
  });
}
