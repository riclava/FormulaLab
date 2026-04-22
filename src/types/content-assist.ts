import type { FormulaRelationDetail } from "@/types/formula";
import type { MemoryHookType } from "@/types/memory-hook";

export type ContentAssistDraftStatus = "draft" | "approved";

export type ContentAssistReviewItemDraft = {
  type: "recall" | "recognition" | "application";
  prompt: string;
  answer: string;
  explanation: string;
  difficulty: number;
};

export type ContentAssistRelationDraft = {
  toSlug: string;
  toTitle: string;
  relationType: FormulaRelationDetail["relationType"];
  note: string;
};

export type ContentAssistMemoryHookDraft = {
  type: MemoryHookType;
  content: string;
  prompt: string;
};

export type ContentAssistVariableDraft = {
  symbol: string;
  name: string;
  description: string;
  unit?: string | null;
};

export type ContentAssistDraft = {
  schemaVersion: 1;
  formulaId: string;
  formulaSlug: string;
  formulaTitle: string;
  formulaDomain: string;
  status: ContentAssistDraftStatus;
  generator: {
    id: "heuristic-v1";
    label: string;
  };
  generatedAt: string;
  updatedAt: string;
  approvedAt: string | null;
  reviewerNotes: string;
  explanation: {
    oneLineUse: string;
    meaning: string;
    useConditions: string[];
    nonUseConditions: string[];
    antiPatterns: string[];
    typicalProblems: string[];
    variableExplanations: ContentAssistVariableDraft[];
  };
  reviewItems: ContentAssistReviewItemDraft[];
  relationCandidates: ContentAssistRelationDraft[];
  memoryHookCandidates: ContentAssistMemoryHookDraft[];
};

export type ContentAssistWorkspaceItem = {
  formulaId: string;
  formulaSlug: string;
  title: string;
  domain: string;
  oneLineUse: string;
  difficulty: number;
  draftStatus: ContentAssistDraftStatus | null;
  draftUpdatedAt: string | null;
  approvedAt: string | null;
};
