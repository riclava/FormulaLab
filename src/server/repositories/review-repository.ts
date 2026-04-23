import { prisma } from "@/lib/db/prisma";

export async function getUserFormulaState(userId: string, formulaId: string) {
  return prisma.userFormulaState.findUnique({
    where: {
      userId_formulaId: {
        userId,
        formulaId,
      },
    },
  });
}

export async function listDueFormulaStates({
  userId,
  now,
  take,
}: {
  userId: string;
  now: Date;
  take: number;
}) {
  return prisma.userFormulaState.findMany({
    where: {
      userId,
      nextReviewAt: {
        lte: now,
      },
    },
    include: {
      formula: {
        include: {
          reviewItems: {
            orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
          },
          memoryHooks: {
            where: {
              userId,
            },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: [{ nextReviewAt: "asc" }, { updatedAt: "asc" }],
    take,
  });
}

export async function listWeakFormulaStatesForReview({
  userId,
  take,
}: {
  userId: string;
  take: number;
}) {
  return prisma.userFormulaState.findMany({
    where: {
      userId,
      OR: [
        {
          memoryStrength: {
            lt: 0.55,
          },
        },
        {
          lapseCount: {
            gt: 0,
          },
        },
        {
          difficultyEstimate: {
            gte: 3,
          },
        },
      ],
    },
    include: {
      formula: {
        include: {
          reviewItems: {
            orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
          },
          memoryHooks: {
            where: {
              userId,
            },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: [
      { lapseCount: "desc" },
      { memoryStrength: "asc" },
      { difficultyEstimate: "desc" },
      { updatedAt: "desc" },
    ],
    take,
  });
}

export async function countUserFormulaStates(userId: string) {
  return prisma.userFormulaState.count({
    where: {
      userId,
    },
  });
}

export async function createStudySession({
  userId,
  domain,
}: {
  userId: string;
  domain: string;
}) {
  return prisma.studySession.create({
    data: {
      userId,
      domain,
    },
  });
}

export async function getStudySessionById({
  sessionId,
  userId,
}: {
  sessionId: string;
  userId: string;
}) {
  return prisma.studySession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: {
      reviewLogs: true,
    },
  });
}

export async function createReviewLog({
  userId,
  formulaId,
  reviewItemId,
  studySessionId,
  result,
  responseTimeMs,
  memoryHookUsedId,
}: {
  userId: string;
  formulaId: string;
  reviewItemId: string;
  studySessionId: string;
  result: "again" | "hard" | "good" | "easy";
  responseTimeMs?: number;
  memoryHookUsedId?: string;
}) {
  return prisma.reviewLog.create({
    data: {
      userId,
      formulaId,
      reviewItemId,
      studySessionId,
      result,
      responseTimeMs,
      memoryHookUsedId,
    },
  });
}

export async function updateUserFormulaState({
  userId,
  formulaId,
  data,
}: {
  userId: string;
  formulaId: string;
  data: {
    memoryStrength: number;
    stability: number;
    difficultyEstimate: number;
    lastReviewedAt: Date;
    nextReviewAt: Date;
    totalReviews: number;
    correctReviews: number;
    lapseCount: number;
    consecutiveCorrect: number;
  };
}) {
  return prisma.userFormulaState.update({
    where: {
      userId_formulaId: {
        userId,
        formulaId,
      },
    },
    data,
  });
}

export async function completeStudySession(sessionId: string) {
  return prisma.studySession.update({
    where: {
      id: sessionId,
    },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
  });
}

export async function deferFormulaReview({
  userId,
  formulaId,
  nextReviewAt,
}: {
  userId: string;
  formulaId: string;
  nextReviewAt: Date;
}) {
  return prisma.userFormulaState.update({
    where: {
      userId_formulaId: {
        userId,
        formulaId,
      },
    },
    data: {
      nextReviewAt,
    },
  });
}

export async function getReviewHintSource({
  userId,
  formulaId,
}: {
  userId: string;
  formulaId: string;
}) {
  return prisma.userFormulaState.findUnique({
    where: {
      userId_formulaId: {
        userId,
        formulaId,
      },
    },
    include: {
      formula: {
        include: {
          memoryHooks: {
            where: {
              userId,
            },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });
}
