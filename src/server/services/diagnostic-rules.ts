import type { DiagnosticAssessment } from "@/types/diagnostic";

export type DiagnosticReviewItemResult = {
  id: string;
  formulaId: string;
};

export function getDiagnosticAssessmentPriority(
  assessment: DiagnosticAssessment,
) {
  if (assessment === "clear") {
    return 3;
  }

  if (assessment === "partial") {
    return 2;
  }

  return 1;
}

export function calculateDiagnosticWeakFormulaIds({
  reviewItems,
  answers,
}: {
  reviewItems: DiagnosticReviewItemResult[];
  answers: Array<{
    reviewItemId: string;
    assessment: DiagnosticAssessment;
  }>;
}) {
  const answersByReviewItemId = new Map(
    answers.map((answer) => [answer.reviewItemId, answer.assessment]),
  );

  return Array.from(
    new Set(
      reviewItems
        .filter((item) => {
          const assessment = answersByReviewItemId.get(item.id);
          return assessment === "none" || assessment === "partial";
        })
        .map((item) => item.formulaId),
    ),
  );
}

export function calculateBestDiagnosticAssessmentsByFormula({
  reviewItems,
  answers,
}: {
  reviewItems: DiagnosticReviewItemResult[];
  answers: Array<{
    reviewItemId: string;
    assessment: DiagnosticAssessment;
  }>;
}) {
  const answersByReviewItemId = new Map(
    answers.map((answer) => [answer.reviewItemId, answer.assessment]),
  );
  const assessmentsByFormulaId = new Map<string, DiagnosticAssessment>();

  for (const item of reviewItems) {
    const assessment = answersByReviewItemId.get(item.id) ?? "none";
    const previous = assessmentsByFormulaId.get(item.formulaId);

    if (
      !previous ||
      getDiagnosticAssessmentPriority(assessment) >
        getDiagnosticAssessmentPriority(previous)
    ) {
      assessmentsByFormulaId.set(item.formulaId, assessment);
    }
  }

  return assessmentsByFormulaId;
}
