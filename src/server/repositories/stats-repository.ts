import { prisma } from "@/lib/db/prisma";

export async function getLatestCompletedStudySessionSummary({
  userId,
  domain,
}: {
  userId: string;
  domain: string;
}) {
  return prisma.studySession.findFirst({
    where: {
      userId,
      domain,
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
              ownerUserId: true,
            },
          },
          memoryHookUsed: {
            select: {
              id: true,
              content: true,
            },
          },
        },
      },
    },
  });
}

export async function listRecentStudySessions({
  userId,
  domain,
  take = 60,
}: {
  userId: string;
  domain: string;
  take?: number;
}) {
  return prisma.studySession.findMany({
    where: {
      userId,
      domain,
    },
    orderBy: {
      startedAt: "desc",
    },
    take,
  });
}

export async function listReviewLogsForUser({
  userId,
  domain,
  take = 500,
}: {
  userId: string;
  domain: string;
  take?: number;
}) {
  return prisma.reviewLog.findMany({
    where: {
      userId,
      formula: {
        domain,
      },
    },
    orderBy: {
      reviewedAt: "asc",
    },
    include: {
      reviewItem: {
        select: {
          type: true,
        },
      },
    },
    take,
  });
}

export async function listWeakFormulaStates({
  userId,
  domain,
  take = 8,
}: {
  userId: string;
  domain: string;
  take?: number;
}) {
  return prisma.userFormulaState.findMany({
    where: {
      userId,
      formula: {
        domain,
      },
    },
    include: {
      formula: {
        include: {
          memoryHooks: {
            where: {
              userId,
            },
            select: {
              id: true,
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

export async function countProgressBuckets({
  userId,
  domain,
}: {
  userId: string;
  domain: string;
}) {
  const now = new Date();
  const domainWhere = {
    formula: {
      domain,
    },
  };

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
      where: {
        userId,
        ...domainWhere,
      },
    }),
    prisma.userFormulaState.count({
      where: {
        userId,
        ...domainWhere,
        nextReviewAt: {
          lte: now,
        },
      },
    }),
    prisma.userFormulaState.count({
      where: {
        userId,
        ...domainWhere,
        nextReviewAt: {
          gt: now,
        },
      },
    }),
    prisma.userFormulaState.count({
      where: {
        userId,
        ...domainWhere,
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
        ...domainWhere,
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
        formula: {
          domain,
        },
      },
      distinct: ["formulaId"],
      select: {
        formulaId: true,
      },
    }),
    prisma.diagnosticAttempt.findFirst({
      where: {
        userId,
        domain,
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
  domain,
  from,
  formulaIds,
}: {
  userId: string;
  domain: string;
  from: Date;
  formulaIds: string[];
}) {
  const [createdHooks, usedHooks] = await Promise.all([
    prisma.formulaMemoryHook.findMany({
      where: {
        userId,
        formula: {
          domain,
        },
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

export async function listAccessibleMemoryHooks({
  userId,
  domain,
}: {
  userId: string;
  domain: string;
}) {
  return prisma.formulaMemoryHook.findMany({
    where: {
      userId,
      formula: {
        domain,
      },
    },
    select: {
      id: true,
    },
  });
}

export async function listProductEvents({
  userId,
  domain,
}: {
  userId: string;
  domain: string;
}) {
  return prisma.productEvent.findMany({
    where: {
      userId,
      OR: [
        {
          formula: {
            domain,
          },
        },
        {
          studySession: {
            domain,
          },
        },
      ],
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
