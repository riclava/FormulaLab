import { prisma } from "@/lib/db/prisma";
import type { DiagnosticAssessment } from "@/types/diagnostic";

const diagnosticQuestionInclude = {
  formula: {
    include: {
      _count: {
        select: {
          reviewItems: true,
          memoryHooks: true,
        },
      },
    },
  },
} as const;

export async function listDiagnosticReviewItems({
  domain,
  take,
}: {
  domain: string;
  take: number;
}) {
  return prisma.reviewItem.findMany({
    where: {
      formula: {
        domain,
      },
    },
    include: diagnosticQuestionInclude,
    orderBy: [
      {
        difficulty: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
    take,
  });
}

export async function listReviewItemsByIds({
  domain,
  reviewItemIds,
}: {
  domain: string;
  reviewItemIds: string[];
}) {
  return prisma.reviewItem.findMany({
    where: {
      id: {
        in: reviewItemIds,
      },
      formula: {
        domain,
      },
    },
    include: {
      formula: true,
    },
  });
}

export async function createDiagnosticAttempt({
  userId,
  domain,
  reviewItemIds,
  weakFormulaIds,
}: {
  userId: string;
  domain: string;
  reviewItemIds: string[];
  weakFormulaIds: string[];
}) {
  return prisma.diagnosticAttempt.create({
    data: {
      userId,
      domain,
      reviewItemIds,
      weakFormulaIds,
    },
  });
}

export async function getLatestDiagnosticAttempt({
  userId,
  domain,
}: {
  userId: string;
  domain: string;
}) {
  return prisma.diagnosticAttempt.findFirst({
    where: {
      userId,
      domain,
    },
    orderBy: {
      completedAt: "desc",
    },
  });
}

export async function upsertDiagnosticFormulaStates({
  userId,
  formulaIds,
  weakFormulaIds,
  assessmentsByFormulaId,
}: {
  userId: string;
  formulaIds: string[];
  weakFormulaIds: string[];
  assessmentsByFormulaId: Map<string, DiagnosticAssessment>;
}) {
  const weakFormulaIdSet = new Set(weakFormulaIds);
  const now = new Date();
  const threeDaysLater = new Date(now);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);

  await prisma.$transaction(
    formulaIds.map((formulaId) => {
      const assessment = assessmentsByFormulaId.get(formulaId) ?? "none";
      const isWeak = weakFormulaIdSet.has(formulaId);

      return prisma.userFormulaState.upsert({
        where: {
          userId_formulaId: {
            userId,
            formulaId,
          },
        },
        create: {
          userId,
          formulaId,
          memoryStrength: assessment === "clear" ? 0.7 : assessment === "partial" ? 0.35 : 0.05,
          stability: assessment === "clear" ? 3 : assessment === "partial" ? 1 : 0,
          difficultyEstimate: assessment === "clear" ? 1 : assessment === "partial" ? 2 : 3,
          nextReviewAt: isWeak ? now : threeDaysLater,
        },
        update: {
          memoryStrength: assessment === "clear" ? 0.7 : assessment === "partial" ? 0.35 : 0.05,
          stability: assessment === "clear" ? 3 : assessment === "partial" ? 1 : 0,
          difficultyEstimate: assessment === "clear" ? 1 : assessment === "partial" ? 2 : 3,
          nextReviewAt: isWeak ? now : threeDaysLater,
        },
      });
    }),
  );
}
