import {
  completeStudySession,
  countUserFormulaStates,
  createReviewLog,
  createStudySession,
  deferFormulaReview,
  getReviewHintSource,
  getStudySessionById,
  getUserFormulaState,
  listDueFormulaStates,
  updateUserFormulaState,
} from "@/server/repositories/review-repository";
import { recordMemoryHookUsed } from "@/server/services/formula-service";
import type {
  ReviewGrade,
  ReviewHint,
  ReviewQueueItem,
  ReviewSessionPayload,
  ReviewSessionSnapshot,
  ReviewSubmitInput,
  ReviewSubmitResult,
} from "@/types/review";

const REVIEW_QUEUE_LIMIT = 8;
const REVIEW_TYPE_CYCLE: Array<"recall" | "recognition" | "recall" | "application"> =
  ["recall", "recognition", "recall", "application"];

const REVIEW_INTERVAL_MS: Record<ReviewGrade, number> = {
  again: 10 * 60 * 1000,
  hard: 24 * 60 * 60 * 1000,
  good: 3 * 24 * 60 * 60 * 1000,
  easy: 7 * 24 * 60 * 60 * 1000,
};

export async function getTodayReviewSession({
  userId,
}: {
  userId: string;
}): Promise<ReviewSessionPayload> {
  const [formulaStateCount, dueStates] = await Promise.all([
    countUserFormulaStates(userId),
    listDueFormulaStates({
      userId,
      now: new Date(),
      take: REVIEW_QUEUE_LIMIT,
    }),
  ]);

  if (dueStates.length === 0) {
    return {
      sessionId: null,
      domain: null,
      items: [],
      emptyReason:
        formulaStateCount === 0 ? "needs_diagnostic" : "no_due_reviews",
    };
  }

  const eligibleStates = dueStates.filter((state) => state.formula.reviewItems.length > 0);

  if (eligibleStates.length === 0) {
    return {
      sessionId: null,
      domain: null,
      items: [],
      emptyReason: "no_review_content",
    };
  }

  const items = eligibleStates.map((state, index) =>
    selectReviewQueueItem({
      state,
      preferredType: REVIEW_TYPE_CYCLE[index % REVIEW_TYPE_CYCLE.length],
    }),
  );
  const session = await createStudySession({
    userId,
    domain: items[0]?.formula.domain ?? eligibleStates[0].formula.domain,
  });

  return {
    sessionId: session.id,
    domain: session.domain,
    items,
    emptyReason: null,
  };
}

export async function submitReview({
  userId,
  input,
}: {
  userId: string;
  input: ReviewSubmitInput;
}): Promise<ReviewSubmitResult> {
  const [state, session] = await Promise.all([
    getUserFormulaState(userId, input.formulaId),
    getStudySessionById({
      sessionId: input.sessionId,
      userId,
    }),
  ]);

  if (!state || !session) {
    throw new Error("Review state or session not found");
  }

  const now = new Date();
  const nextState = calculateNextFormulaState({
    state,
    result: input.result,
    now,
  });

  await Promise.all([
    createReviewLog({
      userId,
      formulaId: input.formulaId,
      reviewItemId: input.reviewItemId,
      studySessionId: input.sessionId,
      result: input.result,
      responseTimeMs: input.responseTimeMs,
      memoryHookUsedId: input.memoryHookUsedId,
    }),
    updateUserFormulaState({
      userId,
      formulaId: input.formulaId,
      data: nextState,
    }),
  ]);

  if (input.completed && session.status !== "completed") {
    await completeStudySession(input.sessionId);
  }

  return {
    sessionId: input.sessionId,
    formulaId: input.formulaId,
    nextReviewAt: nextState.nextReviewAt.toISOString(),
    result: input.result,
  };
}

export async function deferReview({
  userId,
  formulaId,
  minutes = 10,
}: {
  userId: string;
  formulaId: string;
  minutes?: number;
}) {
  const nextReviewAt = new Date(Date.now() + minutes * 60 * 1000);
  const state = await deferFormulaReview({
    userId,
    formulaId,
    nextReviewAt,
  });

  return {
    formulaId: state.formulaId,
    nextReviewAt: state.nextReviewAt?.toISOString() ?? nextReviewAt.toISOString(),
  };
}

export async function getReviewHint({
  userId,
  formulaId,
}: {
  userId: string;
  formulaId: string;
}): Promise<ReviewHint> {
  const formula = await getReviewHintSource({
    userId,
    formulaId,
  });

  if (!formula) {
    throw new Error("Formula not found");
  }

  const hook = formula.memoryHooks[0];

  if (hook) {
    await recordMemoryHookUsed({
      hookId: hook.id,
      userId,
    });

    return {
      formulaId,
      content: hook.content,
      source: "memory_hook",
      memoryHookUsedId: hook.id,
    };
  }

  return {
    formulaId,
    content: formula.oneLineUse,
    source: "one_line_use",
    memoryHookUsedId: null,
  };
}

export async function getReviewSessionSnapshot({
  userId,
  sessionId,
}: {
  userId: string;
  sessionId: string;
}): Promise<ReviewSessionSnapshot | null> {
  const session = await getStudySessionById({
    sessionId,
    userId,
  });

  if (!session) {
    return null;
  }

  const grades: Record<ReviewGrade, number> = {
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  };

  for (const log of session.reviewLogs) {
    grades[log.result] += 1;
  }

  return {
    id: session.id,
    domain: session.domain,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    reviewCount: session.reviewLogs.length,
    grades,
  };
}

function selectReviewQueueItem({
  state,
  preferredType,
}: {
  state: Awaited<ReturnType<typeof listDueFormulaStates>>[number];
  preferredType: "recall" | "recognition" | "application";
}): ReviewQueueItem {
  const reviewItem =
    state.formula.reviewItems.find((item) => item.type === preferredType) ??
    state.formula.reviewItems[0];
  const isWeak = state.memoryStrength < 0.4 || state.lapseCount > 0;
  const isStable = state.memoryStrength >= 0.7 && state.consecutiveCorrect >= 3;
  const trainingStatus = isWeak
    ? "weak"
    : isStable
      ? "stable"
      : "due_now";

  return {
    reviewItemId: reviewItem.id,
    formulaId: state.formulaId,
    type: reviewItem.type,
    prompt: reviewItem.prompt,
    answer: reviewItem.answer,
    explanation: reviewItem.explanation,
    difficulty: reviewItem.difficulty,
    formula: {
      id: state.formula.id,
      slug: state.formula.slug,
      title: state.formula.title,
      expressionLatex: state.formula.expressionLatex,
      domain: state.formula.domain,
      subdomain: state.formula.subdomain,
      oneLineUse: state.formula.oneLineUse,
      difficulty: state.formula.difficulty,
      tags: state.formula.tags,
      variablePreview: [],
      reviewItemCount: state.formula.reviewItems.length,
      memoryHookCount: state.formula.memoryHooks.length,
      trainingStatus,
      trainingStatusLabel:
        trainingStatus === "weak"
          ? "需要补弱"
          : trainingStatus === "stable"
            ? "稳定中"
            : "今天该复习",
      nextReviewAt: state.nextReviewAt?.toISOString() ?? null,
      isWeak,
      isDueNow: true,
      hasPersonalMemoryHook: state.formula.memoryHooks.some(
        (hook) => hook.userId !== null,
      ),
      totalReviews: state.totalReviews,
      correctReviews: state.correctReviews,
      meaning: state.formula.meaning,
    },
  };
}

function calculateNextFormulaState({
  state,
  result,
  now,
}: {
  state: NonNullable<Awaited<ReturnType<typeof getUserFormulaState>>>;
  result: ReviewGrade;
  now: Date;
}) {
  const correct = result === "good" || result === "easy";
  const nextConsecutiveCorrect = correct ? state.consecutiveCorrect + 1 : 0;
  const multiplier = getReviewMultiplier(nextConsecutiveCorrect);
  const nextReviewAt = new Date(
    now.getTime() + REVIEW_INTERVAL_MS[result] * multiplier,
  );

  return {
    memoryStrength: clamp(
      result === "again"
        ? state.memoryStrength - 0.35
        : result === "hard"
          ? state.memoryStrength - 0.15
          : result === "good"
            ? state.memoryStrength + 0.2
            : state.memoryStrength + 0.3,
      0.05,
      1,
    ),
    stability: clamp(
      result === "again"
        ? 0
        : result === "hard"
          ? state.stability - 1
          : result === "good"
            ? state.stability + 1
            : state.stability + 2,
      0,
      365,
    ),
    difficultyEstimate: clamp(
      result === "again"
        ? state.difficultyEstimate + 0.4
        : result === "hard"
          ? state.difficultyEstimate + 0.2
          : result === "good"
            ? state.difficultyEstimate - 0.1
            : state.difficultyEstimate - 0.2,
      1,
      5,
    ),
    lastReviewedAt: now,
    nextReviewAt,
    totalReviews: state.totalReviews + 1,
    correctReviews: state.correctReviews + (correct ? 1 : 0),
    lapseCount: state.lapseCount + (result === "again" ? 1 : 0),
    consecutiveCorrect: nextConsecutiveCorrect,
  };
}

function getReviewMultiplier(consecutiveCorrect: number) {
  if (consecutiveCorrect >= 5) {
    return 3;
  }

  if (consecutiveCorrect >= 3) {
    return 2;
  }

  return 1;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
