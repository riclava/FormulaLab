import {
  createDiagnosticAttempt,
  getLatestDiagnosticAttempt,
  listDiagnosticReviewItems,
  listReviewItemsByIds,
  upsertDiagnosticFormulaStates,
} from "@/server/repositories/diagnostic-repository";
import {
  calculateBestDiagnosticAssessmentsByFormula,
  calculateDiagnosticWeakFormulaIds,
} from "@/server/services/diagnostic-rules";
import { getFormulaSummaries } from "@/server/services/formula-service";
import type {
  DiagnosticResult,
  DiagnosticStart,
  DiagnosticSubmission,
} from "@/types/diagnostic";
import type { FormulaSummary } from "@/types/formula";

const DEFAULT_DIAGNOSTIC_DOMAIN = "概率统计";
const DIAGNOSTIC_QUESTION_COUNT = 5;

export async function startDiagnostic({
  domain = DEFAULT_DIAGNOSTIC_DOMAIN,
}: {
  domain?: string;
} = {}): Promise<DiagnosticStart> {
  const reviewItems = await listDiagnosticReviewItems({
    domain,
    take: DIAGNOSTIC_QUESTION_COUNT,
  });

  return {
    domain,
    questions: reviewItems.map((item) => ({
      id: item.id,
      formulaId: item.formulaId,
      type: item.type,
      prompt: item.prompt,
      answer: item.answer,
      explanation: item.explanation,
      difficulty: item.difficulty,
      formula: toFormulaSummary(item.formula),
    })),
  };
}

export async function submitDiagnostic({
  userId,
  submission,
}: {
  userId: string;
  submission: DiagnosticSubmission;
}): Promise<DiagnosticResult> {
  const reviewItemIds = submission.answers.map((answer) => answer.reviewItemId);
  const reviewItems = await listReviewItemsByIds(reviewItemIds);
  const formulaIds = Array.from(
    new Set(reviewItems.map((item) => item.formulaId)),
  );
  const weakFormulaIds = calculateDiagnosticWeakFormulaIds({
    reviewItems,
    answers: submission.answers,
  });
  const assessmentsByFormulaId = calculateBestDiagnosticAssessmentsByFormula({
    reviewItems,
    answers: submission.answers,
  });

  await upsertDiagnosticFormulaStates({
    userId,
    formulaIds,
    weakFormulaIds,
    assessmentsByFormulaId,
  });

  const attempt = await createDiagnosticAttempt({
    userId,
    domain: submission.domain,
    reviewItemIds,
    weakFormulaIds,
  });

  const weakFormulas = await getWeakFormulaSummaries(weakFormulaIds);

  return {
    id: attempt.id,
    domain: attempt.domain,
    reviewItemIds: attempt.reviewItemIds,
    weakFormulaIds: attempt.weakFormulaIds,
    completedAt: attempt.completedAt.toISOString(),
    weakFormulas,
    reviewQueueFormulaIds: weakFormulaIds.length > 0 ? weakFormulaIds : formulaIds,
  };
}

export async function getLatestDiagnosticResult({
  userId,
}: {
  userId: string;
}): Promise<DiagnosticResult | null> {
  const attempt = await getLatestDiagnosticAttempt(userId);

  if (!attempt) {
    return null;
  }

  const weakFormulas = await getWeakFormulaSummaries(attempt.weakFormulaIds);

  return {
    id: attempt.id,
    domain: attempt.domain,
    reviewItemIds: attempt.reviewItemIds,
    weakFormulaIds: attempt.weakFormulaIds,
    completedAt: attempt.completedAt.toISOString(),
    weakFormulas,
    reviewQueueFormulaIds: attempt.weakFormulaIds,
  };
}

async function getWeakFormulaSummaries(formulaIds: string[]) {
  if (formulaIds.length === 0) {
    return [];
  }

  const summaries = await getFormulaSummaries();
  const formulaIdSet = new Set(formulaIds);

  return summaries.filter((formula) => formulaIdSet.has(formula.id));
}

function toFormulaSummary(formula: {
  id: string;
  slug: string;
  title: string;
  expressionLatex: string;
  domain: string;
  subdomain: string | null;
  oneLineUse: string;
  difficulty: number;
  tags: string[];
  variables?: Array<{
    symbol: string;
    name: string;
  }>;
  _count: {
    reviewItems: number;
    memoryHooks: number;
  };
}): FormulaSummary {
  return {
    id: formula.id,
    slug: formula.slug,
    title: formula.title,
    expressionLatex: formula.expressionLatex,
    domain: formula.domain,
    subdomain: formula.subdomain,
    oneLineUse: formula.oneLineUse,
    difficulty: formula.difficulty,
    tags: formula.tags,
    variablePreview: formula.variables ?? [],
    reviewItemCount: formula._count.reviewItems,
    memoryHookCount: formula._count.memoryHooks,
    trainingStatus: "not_started",
    trainingStatusLabel: "尚未进入训练",
    nextReviewAt: null,
    isWeak: false,
    isDueNow: false,
    hasPersonalMemoryHook: false,
    totalReviews: 0,
    correctReviews: 0,
  };
}
