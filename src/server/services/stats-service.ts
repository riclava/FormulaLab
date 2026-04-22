import {
  countProgressBuckets,
  createProductEvents,
  getLatestCompletedStudySessionSummary,
  listAccessibleMemoryHooks,
  listProductEvents,
  listRecentMemoryHookActivity,
  listRecentStudySessions,
  listReviewLogsForUser,
  listWeakFormulaStates,
} from "@/server/repositories/stats-repository";
import type { ProgressStats, SummaryStats, WeakFormulaStat } from "@/types/stats";

export async function getSummaryStats({
  userId,
}: {
  userId: string;
}): Promise<SummaryStats> {
  const [latestSession, weakStates, sessions, logs, hooks, events] = await Promise.all([
    getLatestCompletedStudySessionSummary(userId),
    listWeakFormulaStates(userId, 6),
    listRecentStudySessions(userId, 90),
    listReviewLogsForUser(userId, 1000),
    listAccessibleMemoryHooks(userId),
    listProductEvents(userId),
  ]);

  if (!latestSession) {
    return {
      latestSession: null,
      nextSuggestedReviewAt: weakStates[0]?.nextReviewAt?.toISOString() ?? null,
      immediateWeakFormulas: weakStates.map(toWeakFormulaStat),
      memoryHookActivity: [],
      metrics: buildMetrics({
        sessions,
        logs,
        hooks,
        events,
      }),
    };
  }

  const grades = {
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  } as const satisfies Record<"again" | "hard" | "good" | "easy", number>;

  const mutableGrades = { ...grades };

  for (const log of latestSession.reviewLogs) {
    mutableGrades[log.result] += 1;
  }

  const responseTimes = latestSession.reviewLogs
    .map((log) => log.responseTimeMs)
    .filter((value): value is number => typeof value === "number");
  const averageResponseTimeMs =
    responseTimes.length > 0
      ? Math.round(
          responseTimes.reduce((total, value) => total + value, 0) /
            responseTimes.length,
        )
      : null;

  const formulaIds = Array.from(
    new Set(latestSession.reviewLogs.map((log) => log.formulaId)),
  );
  const hookActivity = await listRecentMemoryHookActivity({
    userId,
    from: latestSession.startedAt,
    formulaIds,
  });

  const immediateWeakFormulas = buildWeakFormulasFromSession({
    session: latestSession,
    weakStates,
  });

  return {
    latestSession: {
      id: latestSession.id,
      domain: latestSession.domain,
      startedAt: latestSession.startedAt.toISOString(),
      completedAt: latestSession.completedAt?.toISOString() ?? null,
      reviewCount: latestSession.reviewLogs.length,
      durationMinutes: Math.max(
        1,
        Math.round(
          ((latestSession.completedAt ?? latestSession.startedAt).getTime() -
            latestSession.startedAt.getTime()) /
            60000,
        ),
      ),
      averageResponseTimeMs,
      grades: mutableGrades,
    },
    nextSuggestedReviewAt: weakStates[0]?.nextReviewAt?.toISOString() ?? null,
    immediateWeakFormulas,
    memoryHookActivity: [
      ...hookActivity.createdHooks.map((hook) => ({
        id: hook.id,
        formulaId: hook.formula.id,
        formulaTitle: hook.formula.title,
        content: hook.content,
        source: "created" as const,
        timestamp: hook.createdAt.toISOString(),
        helpfulCount: hook.helpfulCount,
      })),
      ...hookActivity.usedHooks
        .filter((log) => log.memoryHookUsed)
        .map((log) => ({
          id: log.memoryHookUsed!.id,
          formulaId: log.formula.id,
          formulaTitle: log.formula.title,
          content: log.memoryHookUsed!.content,
          source: "used" as const,
          timestamp: log.reviewedAt.toISOString(),
          helpfulCount: log.memoryHookUsed!.helpfulCount,
        })),
    ]
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
      .slice(0, 8),
    metrics: buildMetrics({
      sessions,
      logs,
      hooks,
      events,
    }),
  };
}

export async function getProgressStats({
  userId,
}: {
  userId: string;
}): Promise<ProgressStats> {
  const progress = await countProgressBuckets(userId);

  return {
    trackedFormulaCount: progress.trackedFormulaCount,
    dueNowCount: progress.dueNowCount,
    scheduledCount: progress.scheduledCount,
    stableCount: progress.stableCount,
    weakCount: progress.weakCount,
    memoryHookFormulaCount: progress.memoryHookFormulaCount,
    latestDiagnosticAt: progress.latestDiagnosticAt?.toISOString() ?? null,
  };
}

export async function getWeakFormulas({
  userId,
}: {
  userId: string;
}) {
  const weakStates = await listWeakFormulaStates(userId, 8);
  return weakStates.map(toWeakFormulaStat);
}

export async function recordStatsEvents({
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
  await createProductEvents({
    userId,
    events,
  });
}

function buildWeakFormulasFromSession({
  session,
  weakStates,
}: {
  session: NonNullable<
    Awaited<ReturnType<typeof getLatestCompletedStudySessionSummary>>
  >;
  weakStates: Awaited<ReturnType<typeof listWeakFormulaStates>>;
}): WeakFormulaStat[] {
  const scoreByFormulaId = new Map<
    string,
    {
      slug: string;
      title: string;
      domain: string;
      oneLineUse: string;
      againCount: number;
      hardCount: number;
      latestResult: "again" | "hard" | "good" | "easy";
    }
  >();

  for (const log of session.reviewLogs) {
    const current = scoreByFormulaId.get(log.formulaId) ?? {
      slug: log.formula.slug,
      title: log.formula.title,
      domain: log.formula.domain,
      oneLineUse: log.formula.oneLineUse,
      againCount: 0,
      hardCount: 0,
      latestResult: log.result,
    };

    if (log.result === "again") {
      current.againCount += 1;
    }

    if (log.result === "hard") {
      current.hardCount += 1;
    }

    current.latestResult = log.result;
    scoreByFormulaId.set(log.formulaId, current);
  }

  return Array.from(scoreByFormulaId.entries())
    .filter(([, entry]) => entry.againCount > 0 || entry.hardCount > 0)
    .sort((left, right) => {
      const leftScore = left[1].againCount * 3 + left[1].hardCount * 2;
      const rightScore = right[1].againCount * 3 + right[1].hardCount * 2;
      return rightScore - leftScore;
    })
    .map(([formulaId, entry]) => {
      const state = weakStates.find((candidate) => candidate.formulaId === formulaId);

      return {
        formulaId,
        slug: entry.slug,
        title: entry.title,
        domain: entry.domain,
        oneLineUse: entry.oneLineUse,
        latestResult: entry.latestResult,
        againCount: entry.againCount,
        hardCount: entry.hardCount,
        nextReviewAt: state?.nextReviewAt?.toISOString() ?? null,
        memoryHookCount: state?.formula._count.memoryHooks ?? 0,
        reason:
          entry.againCount > 0
            ? "这条公式在本次复习里出现了 Again，建议优先回看适用条件和误用点。"
            : "这条公式在本次复习里偏难，建议再做一次补弱确认边界。",
      };
    })
    .slice(0, 6);
}

function toWeakFormulaStat(
  state: Awaited<ReturnType<typeof listWeakFormulaStates>>[number],
): WeakFormulaStat {
  return {
    formulaId: state.formulaId,
    slug: state.formula.slug,
    title: state.formula.title,
    domain: state.formula.domain,
    oneLineUse: state.formula.oneLineUse,
    latestResult: null,
    againCount: state.lapseCount,
    hardCount: Math.max(0, state.totalReviews - state.correctReviews - state.lapseCount),
    nextReviewAt: state.nextReviewAt?.toISOString() ?? null,
    memoryHookCount: state.formula._count.memoryHooks,
    reason:
      state.lapseCount > 0
        ? "近期出现过遗忘，建议从误用点和例题重新建立判断。"
        : "当前记忆强度偏低，适合先做一轮快速补弱。",
  };
}

function buildMetrics({
  sessions,
  logs,
  hooks,
  events,
}: {
  sessions: Awaited<ReturnType<typeof listRecentStudySessions>>;
  logs: Awaited<ReturnType<typeof listReviewLogsForUser>>;
  hooks: Awaited<ReturnType<typeof listAccessibleMemoryHooks>>;
  events: Awaited<ReturnType<typeof listProductEvents>>;
}) {
  const firstSession = sessions[sessions.length - 1] ?? null;
  const today = new Date();
  const todayKey = dayKey(today);
  const sessionsToday = sessions.filter((session) => dayKey(session.startedAt) === todayKey);
  const completedToday = sessionsToday.filter((session) => session.status === "completed");

  const completionDates = Array.from(
    new Set(
      sessions
        .filter((session) => session.status === "completed")
        .map((session) => dayKey(session.startedAt)),
    ),
  ).sort();

  let nextDayHits = 0;
  let nextDayEligible = 0;
  for (let index = 0; index < completionDates.length - 1; index += 1) {
    nextDayEligible += 1;
    const current = new Date(`${completionDates[index]}T00:00:00`);
    const next = new Date(current);
    next.setDate(current.getDate() + 1);
    if (completionDates[index + 1] === dayKey(next)) {
      nextDayHits += 1;
    }
  }

  const recoveryMap = new Map<
    string,
    { hadTrouble: boolean; recovered: boolean }
  >();
  for (const log of logs) {
    const item = recoveryMap.get(log.formulaId) ?? {
      hadTrouble: false,
      recovered: false,
    };

    if (log.result === "again" || log.result === "hard") {
      item.hadTrouble = true;
    }

    if (item.hadTrouble && (log.result === "good" || log.result === "easy")) {
      item.recovered = true;
    }

    recoveryMap.set(log.formulaId, item);
  }

  const troubleCount = Array.from(recoveryMap.values()).filter((item) => item.hadTrouble).length;
  const recoveredCount = Array.from(recoveryMap.values()).filter((item) => item.recovered).length;

  const impressionCount = events.filter(
    (event) => event.type === "weak_formula_impression",
  ).length;
  const openedCount = events.filter(
    (event) => event.type === "weak_formula_opened",
  ).length;

  const againHardCount = logs.filter(
    (log) => log.result === "again" || log.result === "hard",
  ).length;
  const createdHookCount = hooks.filter((hook) => hook.source === "user_created").length;
  const totalHookUses = hooks.reduce((total, hook) => total + hook.usedCount, 0);
  const totalHelpful = hooks.reduce((total, hook) => total + hook.helpfulCount, 0);

  return [
    {
      id: "first_review_completion_rate" as const,
      label: "首次 Review 完成率",
      value:
        firstSession && sessions.length > 0
          ? firstSession.status === "completed"
            ? 1
            : 0
          : null,
      description: "第一轮进入复习后，是否顺利完成整组训练。",
    },
    {
      id: "daily_review_completion_rate" as const,
      label: "每日 Review 完成率",
      value: sessionsToday.length > 0 ? completedToday.length / sessionsToday.length : null,
      description: "今天开始的复习 session 中，有多少真正完成了整组训练。",
    },
    {
      id: "next_day_return_rate" as const,
      label: "次日回访率",
      value: nextDayEligible > 0 ? nextDayHits / nextDayEligible : null,
      description: "完成复习后，第二天是否有继续回来练。",
    },
    {
      id: "again_hard_recovery_rate" as const,
      label: "Again/Hard 回收率",
      value: troubleCount > 0 ? recoveredCount / troubleCount : null,
      description: "曾经 Again/Hard 的公式，后续是否被练回 Good/Easy。",
    },
    {
      id: "weak_formula_click_rate" as const,
      label: "薄弱公式点击率",
      value: impressionCount > 0 ? openedCount / impressionCount : null,
      description: "总结页展示的薄弱公式，有多少被继续点开补弱。",
    },
    {
      id: "memory_hook_creation_rate" as const,
      label: "记忆钩子创建率",
      value: againHardCount > 0 ? createdHookCount / againHardCount : null,
      description: "遇到困难后，用户是否愿意把联想真正写下来。",
    },
    {
      id: "hint_helpful_rate" as const,
      label: "联想提示有效率",
      value: totalHookUses > 0 ? totalHelpful / totalHookUses : null,
      description: "已经被用到的联想提示，有多少被认为确实有帮助。",
    },
  ];
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
