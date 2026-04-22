import type { FormulaSummary } from "@/types/formula";

export type DiagnosticAssessment = "none" | "partial" | "clear";

export type DiagnosticQuestion = {
  id: string;
  formulaId: string;
  type: "recall" | "recognition" | "application";
  prompt: string;
  answer: string;
  explanation: string | null;
  difficulty: number;
  formula: FormulaSummary;
};

export type DiagnosticStart = {
  domain: string;
  questions: DiagnosticQuestion[];
};

export type DiagnosticSubmission = {
  domain: string;
  answers: Array<{
    reviewItemId: string;
    assessment: DiagnosticAssessment;
  }>;
};

export type DiagnosticResult = {
  id: string;
  domain: string;
  reviewItemIds: string[];
  weakFormulaIds: string[];
  completedAt: string;
  weakFormulas: FormulaSummary[];
  reviewQueueFormulaIds: string[];
};
