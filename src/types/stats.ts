import type { ReviewGrade } from "@/types/review";

export type WeakFormulaStat = {
  formulaId: string;
  slug: string;
  title: string;
  domain: string;
  oneLineUse: string;
  latestResult: ReviewGrade | null;
  againCount: number;
  hardCount: number;
  nextReviewAt: string | null;
  memoryHookCount: number;
  reason: string;
};

export type MemoryHookActivity = {
  id: string;
  formulaId: string;
  formulaTitle: string;
  content: string;
  source: "created" | "used";
  timestamp: string;
  helpfulCount: number;
};

export type SummaryStats = {
  latestSession: {
    id: string;
    domain: string;
    startedAt: string;
    completedAt: string | null;
    reviewCount: number;
    durationMinutes: number;
    averageResponseTimeMs: number | null;
    grades: Record<ReviewGrade, number>;
  } | null;
  nextSuggestedReviewAt: string | null;
  immediateWeakFormulas: WeakFormulaStat[];
  memoryHookActivity: MemoryHookActivity[];
  metrics: Array<{
    id:
      | "first_review_completion_rate"
      | "daily_review_completion_rate"
      | "next_day_return_rate"
      | "again_hard_recovery_rate"
      | "weak_formula_click_rate"
      | "memory_hook_creation_rate"
      | "hint_helpful_rate";
    label: string;
    value: number | null;
    description: string;
  }>;
};

export type ProgressStats = {
  trackedFormulaCount: number;
  dueNowCount: number;
  scheduledCount: number;
  stableCount: number;
  weakCount: number;
  memoryHookFormulaCount: number;
  latestDiagnosticAt: string | null;
};

