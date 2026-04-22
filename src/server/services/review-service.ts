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
  listWeakFormulaStatesForReview,
  updateUserFormulaState,
} from "@/server/repositories/review-repository";
import { recordMemoryHookUsed } from "@/server/services/formula-service";
import {
  calculateNextReviewState,
  chooseReviewItemType,
  REVIEW_TYPE_CYCLE,
} from "@/server/services/review-rules";
import type {
  ReviewGrade,
  ReviewHint,
  ReviewMode,
  ReviewQueueItem,
  ReviewSessionPayload,
  ReviewSessionSnapshot,
  ReviewSubmitInput,
  ReviewSubmitResult,
} from "@/types/review";

const REVIEW_QUEUE_LIMIT = 8;

export async function getTodayReviewSession({
  userId,
  mode = "today",
}: {
  userId: string;
  mode?: ReviewMode;
}): Promise<ReviewSessionPayload> {
  const [formulaStateCount, states] = await Promise.all([
    countUserFormulaStates(userId),
    mode === "weak"
      ? listWeakFormulaStatesForReview({
          userId,
          take: REVIEW_QUEUE_LIMIT,
        })
      : listDueFormulaStates({
          userId,
          now: new Date(),
          take: REVIEW_QUEUE_LIMIT,
        }),
  ]);

  if (states.length === 0) {
    return {
      sessionId: null,
      domain: null,
      mode,
      items: [],
      emptyReason:
        formulaStateCount === 0 ? "needs_diagnostic" : "no_due_reviews",
    };
  }

  const eligibleStates = states.filter((state) => state.formula.reviewItems.length > 0);

  if (eligibleStates.length === 0) {
    return {
      sessionId: null,
      domain: null,
      mode,
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
    mode,
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
  const nextState = calculateNextReviewState({
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
  const selectedType = chooseReviewItemType({
    availableTypes: state.formula.reviewItems.map((item) => item.type),
    preferredType,
  });
  const reviewItem =
    state.formula.reviewItems.find((item) => item.type === selectedType) ??
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
