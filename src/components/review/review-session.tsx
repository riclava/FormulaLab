"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Lightbulb,
  Loader2,
  RotateCcw,
} from "lucide-react";

import { LatexRenderer } from "@/components/formula/latex-renderer";
import { ReviewRemediationSheet } from "@/components/review/review-remediation-sheet";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type {
  ReviewHint,
  ReviewGrade,
  ReviewQueueItem,
  ReviewSessionPayload,
  ReviewSubmitResult,
} from "@/types/review";

type CardState = "prompt" | "hint" | "answer";

type ReviewSummary = {
  again: number;
  hard: number;
  good: number;
  easy: number;
};

const gradeButtons: Array<{
  value: "again" | "hard" | "good" | "easy";
  label: string;
  description: string;
}> = [
  { value: "again", label: "Again", description: "10 分钟后" },
  { value: "hard", label: "Hard", description: "1 天后" },
  { value: "good", label: "Good", description: "3 天后" },
  { value: "easy", label: "Easy", description: "7 天后" },
];

export function ReviewSession() {
  const [session, setSession] = useState<ReviewSessionPayload | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardState, setCardState] = useState<CardState>("prompt");
  const [hintByFormulaId, setHintByFormulaId] = useState<Record<string, ReviewHint>>(
    {},
  );
  const [summary, setSummary] = useState<ReviewSummary>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });
  const [helpfulHookIds, setHelpfulHookIds] = useState<string[]>([]);
  const [pendingRemediation, setPendingRemediation] = useState<{
    item: ReviewQueueItem;
    grade: Extract<ReviewGrade, "again" | "hard">;
  } | null>(null);
  const [isRemediationOpen, setIsRemediationOpen] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let ignore = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/review/today");
        const payload = (await response.json()) as {
          data?: ReviewSessionPayload;
          error?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "复习队列加载失败");
        }

        if (!ignore) {
          setSession(payload.data);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(
            loadError instanceof Error ? loadError.message : "复习队列加载失败",
          );
        }
      }
    }

    loadSession();

    return () => {
      ignore = true;
    };
  }, []);

  const items = session?.items ?? [];
  const currentItem = items[currentIndex];
  const completedCount = completedItemCount(currentIndex, items.length, completedSessionId);
  const progress = items.length
    ? Math.round((completedCount / items.length) * 100)
    : 0;
  const currentHint = currentItem ? hintByFormulaId[currentItem.formulaId] : undefined;
  const activeRemediation =
    pendingRemediation?.item.reviewItemId === currentItem?.reviewItemId
      ? pendingRemediation
      : null;

  if (error) {
    return (
      <section className="flex flex-col gap-4 rounded-lg border bg-background p-6 shadow-sm">
        <Badge variant="destructive" className="w-fit">
          复习暂不可用
        </Badge>
        <h2 className="text-xl font-semibold">{error}</h2>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="flex items-center gap-3 rounded-lg border bg-background p-6 shadow-sm">
        <Loader2 data-icon="inline-start" className="animate-spin" />
        <span className="text-sm text-muted-foreground">正在生成今日复习...</span>
      </section>
    );
  }

  if (items.length === 0) {
    return <EmptyReviewState emptyReason={session.emptyReason} />;
  }

  if (completedSessionId) {
    return <CompletedReviewState summary={summary} sessionId={completedSessionId} />;
  }

  return (
    <>
      <section className="flex flex-col gap-6 rounded-lg border bg-background p-6 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Badge>{labelForReviewType(currentItem.type)}</Badge>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {items.length}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {currentItem.formula.domain}
            </span>
          </div>
          <Progress value={progress} aria-label="今日复习进度" />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="max-w-3xl text-2xl font-semibold leading-tight">
            {currentItem.prompt}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {currentItem.formula.oneLineUse}
          </p>
        </div>

        {cardState === "hint" && currentHint ? (
          <div className="rounded-lg border bg-muted/40 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb data-icon="inline-start" />
              <h3 className="font-medium">一点提示</h3>
            </div>
            <p className="text-sm leading-6">{currentHint.content}</p>
            {currentHint.memoryHookUsedId ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={
                    helpfulHookIds.includes(currentHint.memoryHookUsedId)
                      ? "secondary"
                      : "outline"
                  }
                  disabled={
                    isPending || helpfulHookIds.includes(currentHint.memoryHookUsedId)
                  }
                  onClick={() => markHintHelpful(currentHint.memoryHookUsedId!)}
                >
                  {helpfulHookIds.includes(currentHint.memoryHookUsedId)
                    ? "已记录有帮助"
                    : "这个提示有帮助"}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {cardState === "answer" ? (
          <div className="flex flex-col gap-4 rounded-lg border bg-muted/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen data-icon="inline-start" />
                <h3 className="font-medium">参考答案</h3>
              </div>
              <Link
                href={`/formulas/${currentItem.formula.slug}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                查看详情
              </Link>
            </div>
            {currentItem.type === "recall" ? (
              <LatexRenderer block expression={currentItem.formula.expressionLatex} />
            ) : (
              <p className="text-sm leading-6 whitespace-pre-line">{currentItem.answer}</p>
            )}
            {currentItem.explanation ? (
              <p className="text-sm leading-6 text-muted-foreground">
                {currentItem.explanation}
              </p>
            ) : null}
          </div>
        ) : null}

        {cardState !== "answer" ? (
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleHintRequest(currentItem)}
              disabled={isPending}
            >
              <Lightbulb data-icon="inline-start" />
              给我一点提示
            </Button>
            <Button
              type="button"
              onClick={() => setCardState("answer")}
              disabled={isPending}
            >
              <Clock3 data-icon="inline-start" />
              显示答案
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => deferCurrentItem(currentItem)}
              disabled={isPending}
            >
              <RotateCcw data-icon="inline-start" />
              稍后再练
            </Button>
          </div>
        ) : activeRemediation ? (
          <div className="flex flex-col gap-4 rounded-lg border border-amber-200 bg-amber-50/70 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-950">
                已记录为 {activeRemediation.grade === "again" ? "Again" : "Hard"}。
              </p>
              <p className="text-sm leading-6 text-amber-900/90">
                先看一下适用条件、常见误用或记忆钩子，再继续下一题会更稳。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => setIsRemediationOpen(true)}>
                <BookOpen data-icon="inline-start" />
                进入补弱
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => deferAfterRemediation(currentItem)}
                disabled={isPending}
              >
                <RotateCcw data-icon="inline-start" />
                加入今日稍后再练
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={continueAfterRemediation}
              >
                继续下一题
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-4">
            {gradeButtons.map((grade) => (
              <button
                key={grade.value}
                type="button"
                disabled={isPending}
                onClick={() => submitGrade(currentItem, grade.value)}
                className={cn(
                  "rounded-lg border p-4 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60",
                  grade.value === "again" && "border-red-200",
                  grade.value === "hard" && "border-amber-200",
                  grade.value === "good" && "border-blue-200",
                  grade.value === "easy" && "border-emerald-200",
                )}
              >
                <span className="block font-medium">{grade.label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {grade.description}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <ReviewRemediationSheet
        item={activeRemediation?.item ?? null}
        grade={activeRemediation?.grade ?? null}
        open={isRemediationOpen}
        onOpenChange={setIsRemediationOpen}
        onDefer={() => deferAfterRemediation(currentItem)}
        onContinue={continueAfterRemediation}
      />
    </>
  );

  function handleHintRequest(item: ReviewQueueItem) {
    const cachedHint = hintByFormulaId[item.formulaId];

    if (cachedHint) {
      setCardState("hint");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/review/hint", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            formulaId: item.formulaId,
          }),
        });
        const payload = (await response.json()) as {
          data?: ReviewHint;
          error?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "提示加载失败");
        }

        setHintByFormulaId((previous) => ({
          ...previous,
          [item.formulaId]: payload.data!,
        }));
        setCardState("hint");
      } catch (hintError) {
        setError(hintError instanceof Error ? hintError.message : "提示加载失败");
      }
    });
  }

  function deferCurrentItem(item: ReviewQueueItem) {
    startTransition(async () => {
      try {
        const response = await fetch("/api/review/defer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            formulaId: item.formulaId,
            minutes: 10,
          }),
        });
        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "稍后再练失败");
        }

        moveToNextItem();
      } catch (deferError) {
        setError(
          deferError instanceof Error ? deferError.message : "稍后再练失败",
        );
      }
    });
  }

  function markHintHelpful(hookId: string) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/memory-hooks/${hookId}/helpful`, {
          method: "POST",
        });
        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "提示反馈提交失败");
        }

        setHelpfulHookIds((previous) => [...previous, hookId]);
      } catch (helpfulError) {
        setError(
          helpfulError instanceof Error
            ? helpfulError.message
            : "提示反馈提交失败",
        );
      }
    });
  }

  function submitGrade(
    item: ReviewQueueItem,
    grade: "again" | "hard" | "good" | "easy",
  ) {
    if (!session?.sessionId) {
      setError("当前复习 session 不可用");
      return;
    }

    const activeSessionId = session.sessionId;

    startTransition(async () => {
      try {
        const response = await fetch("/api/review/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: activeSessionId,
            reviewItemId: item.reviewItemId,
            formulaId: item.formulaId,
            result: grade,
            memoryHookUsedId: hintByFormulaId[item.formulaId]?.memoryHookUsedId ?? undefined,
            completed: currentIndex === items.length - 1,
          }),
        });
        const payload = (await response.json()) as {
          data?: ReviewSubmitResult;
          error?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "复习提交失败");
        }

        setSummary((previous) => ({
          ...previous,
          [grade]: previous[grade] + 1,
        }));

        if (grade === "again" || grade === "hard") {
          setPendingRemediation({
            item,
            grade,
          });
          setIsRemediationOpen(true);
          return;
        }

        if (currentIndex === items.length - 1) {
          setCompletedSessionId(payload.data.sessionId);
          return;
        }

        moveToNextItem();
      } catch (submitError) {
        setError(
          submitError instanceof Error ? submitError.message : "复习提交失败",
        );
      }
    });
  }

  function moveToNextItem() {
    const activeSessionId = session?.sessionId ?? null;

    setCurrentIndex((previous) => {
      const nextIndex = previous + 1;

      if (nextIndex >= items.length) {
        setCompletedSessionId(activeSessionId);
        return previous;
      }

      return nextIndex;
    });
    setPendingRemediation(null);
    setIsRemediationOpen(false);
    setCardState("prompt");
  }

  function continueAfterRemediation() {
    moveToNextItem();
  }

  function deferAfterRemediation(item: ReviewQueueItem) {
    setPendingRemediation(null);
    setIsRemediationOpen(false);
    deferCurrentItem(item);
  }
}

function EmptyReviewState({
  emptyReason,
}: {
  emptyReason: ReviewSessionPayload["emptyReason"];
}) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border bg-background p-6 shadow-sm">
      <Badge variant="secondary" className="w-fit">
        今日复习
      </Badge>
      <h2 className="text-2xl font-semibold">
        {emptyReason === "needs_diagnostic"
          ? "先做一次首次诊断，生成你的初始复习队列。"
          : emptyReason === "no_review_content"
            ? "当前有到期公式，但还没有可用的 Review 题目。"
          : "当前没有到期的复习任务。"}
      </h2>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
        {emptyReason === "needs_diagnostic"
          ? "诊断会快速标记薄弱公式，把需要优先复习的内容推到今日队列里。"
          : emptyReason === "no_review_content"
            ? "请先为这些公式补齐 Recall、Recognition 或 Application 题目。"
          : "可以稍后回来继续，也可以先去浏览公式详情和内容。"}
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/diagnostic" className={buttonVariants()}>
          前往首次诊断
          <ArrowRight data-icon="inline-end" />
        </Link>
        <Link
          href="/formulas"
          className={buttonVariants({ variant: "outline" })}
        >
          浏览公式
        </Link>
      </div>
    </section>
  );
}

function CompletedReviewState({
  summary,
  sessionId,
}: {
  summary: ReviewSummary;
  sessionId: string;
}) {
  return (
    <section className="flex flex-col gap-6 rounded-lg border bg-background p-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <Badge className="w-fit">今日复习完成</Badge>
        <h2 className="text-2xl font-semibold">这一组训练已经结束。</h2>
        <p className="text-sm text-muted-foreground">
          复习记录已经写入本次 session，可继续进入总结页或返回公式列表。
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {gradeButtons.map((grade) => (
          <div key={grade.value} className="rounded-lg border p-4">
            <p className="text-2xl font-semibold">{summary[grade.value]}</p>
            <p className="text-sm text-muted-foreground">{grade.label}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/summary" className={buttonVariants()}>
          查看总结
        </Link>
        <Link href="/formulas" className={buttonVariants({ variant: "outline" })}>
          继续浏览公式
        </Link>
      </div>
      <p className="text-xs text-muted-foreground">Session ID: {sessionId}</p>
    </section>
  );
}

function labelForReviewType(type: ReviewQueueItem["type"]) {
  if (type === "recall") {
    return "主动回忆";
  }

  if (type === "recognition") {
    return "判断识别";
  }

  return "场景应用";
}

function completedItemCount(
  currentIndex: number,
  itemCount: number,
  completedSessionId: string | null,
) {
  if (completedSessionId) {
    return itemCount;
  }

  return currentIndex;
}
