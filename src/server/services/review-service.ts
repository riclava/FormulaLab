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
  domain,
  mode = "today",
}: {
  userId: string;
  domain: string;
  mode?: ReviewMode;
}): Promise<ReviewSessionPayload> {
  const [formulaStateCount, states] = await Promise.all([
    countUserFormulaStates({
      userId,
      domain,
    }),
    mode === "weak"
      ? listWeakFormulaStatesForReview({
          userId,
          domain,
          take: REVIEW_QUEUE_LIMIT,
        })
      : listDueFormulaStates({
          userId,
          domain,
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
      estimatedMinutes: 0,
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
      estimatedMinutes: 0,
      emptyReason: "no_review_content",
    };
  }

  const items = eligibleStates.map((state, index) =>
    selectReviewQueueItem({
      mode,
      state,
      preferredType: REVIEW_TYPE_CYCLE[index % REVIEW_TYPE_CYCLE.length],
    }),
  );
  const session = await createStudySession({
    userId,
    domain,
  });

  return {
    sessionId: session.id,
    domain: session.domain,
    mode,
    items,
    estimatedMinutes: estimateReviewMinutes(items, mode),
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
  const state = await getReviewHintSource({
    userId,
    formulaId,
  });

  if (!state) {
    throw new Error("Formula not found");
  }

  const hook = state.formula.memoryHooks[0];

  if (hook) {
    return {
      formulaId,
      content: hook.content,
      source: "memory_hook",
      memoryHookUsedId: hook.id,
    };
  }

  return {
    formulaId,
    content: state.formula.oneLineUse,
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
  mode,
  state,
  preferredType,
}: {
  mode: ReviewMode;
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
    reviewReason: buildReviewReason({
      mode,
      state,
    }),
	    formula: {
	      id: state.formula.id,
	      slug: state.formula.slug,
	      ownership: state.formula.ownerUserId ? "personal" : "official",
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
	      hasPersonalMemoryHook: state.formula.memoryHooks.length > 0,
      totalReviews: state.totalReviews,
      correctReviews: state.correctReviews,
      meaning: state.formula.meaning,
    },
  };
}

function buildReviewReason({
  mode,
  state,
}: {
  mode: ReviewMode;
  state: Awaited<ReturnType<typeof listDueFormulaStates>>[number];
}) {
  if (mode === "weak") {
    if (state.lapseCount > 0) {
      return {
        label: "Again 回收",
        detail: "最近出现过遗忘，先把这条公式捞回来。",
      };
    }

    if (state.memoryStrength < 0.55) {
      return {
        label: "记忆偏弱",
        detail: "当前记忆强度偏低，适合单独补一轮。",
      };
    }

    return {
      label: "高难先练",
      detail: "这条公式难度更高，先处理能减少后续卡顿。",
    };
  }

  if (state.totalReviews === 0) {
    return {
      label: "诊断薄弱",
      detail: "首次诊断把它标成了今天最该开始的一批内容。",
    };
  }

  if (state.lapseCount > 0) {
    return {
      label: "需要回收",
      detail: "它近期出现过 Again，今天优先把记忆拉回来。",
    };
  }

  if (state.nextReviewAt) {
    return {
      label: "今天到期",
      detail: `该在 ${new Intl.DateTimeFormat("zh-CN", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(state.nextReviewAt)} 再练一次。`,
    };
  }

  return {
    label: "继续建立",
    detail: "这条公式还在形成期，今天顺手再巩固一次。",
  };
}

function estimateReviewMinutes(
  items: ReviewQueueItem[],
  mode: ReviewMode,
) {
  if (items.length === 0) {
    return 0;
  }

  const estimatedSeconds = items.reduce((total, item) => {
    const base =
      item.type === "application" ? 70 : item.type === "recognition" ? 40 : 50;

    return total + (mode === "weak" ? base + 15 : base);
  }, 0);

  return Math.max(1, Math.ceil(estimatedSeconds / 60));
}
