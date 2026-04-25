import type { MemoryHookRecord } from "@/types/memory-hook";

export type FormulaTrainingStatus =
  | "not_started"
  | "weak"
  | "due_now"
  | "learning"
  | "scheduled"
  | "stable";

export type FormulaSummary = {
  id: string;
  slug: string;
  ownership: "official" | "personal";
  title: string;
  expressionLatex: string;
  domain: string;
  subdomain: string | null;
  oneLineUse: string;
  difficulty: number;
  tags: string[];
  variablePreview: Array<{
    symbol: string;
    name: string;
  }>;
  reviewItemCount: number;
  memoryHookCount: number;
  trainingStatus: FormulaTrainingStatus;
  trainingStatusLabel: string;
  nextReviewAt: string | null;
  isWeak: boolean;
  isDueNow: boolean;
  hasPersonalMemoryHook: boolean;
  totalReviews: number;
  correctReviews: number;
};

export type FormulaCatalog = {
  formulas: FormulaSummary[];
  filters: {
    domains: string[];
    tags: string[];
    difficulties: number[];
  };
};

export type FormulaPlotConfig = {
  type: "explicit";
  title?: string;
  description?: string;
  x: {
    min: number;
    max: number;
    label?: string;
  };
  y: {
    expression: string;
    label?: string;
  };
  parameters: Array<{
    name: string;
    label?: string;
    defaultValue: number;
    min: number;
    max: number;
    step?: number;
  }>;
  viewBox?: {
    x?: [number, number];
    y?: [number, number];
  };
};

export type FormulaDetail = FormulaSummary & {
  meaning: string;
  intuition: string | null;
  derivation: string | null;
  useConditions: string[];
  nonUseConditions: string[];
  antiPatterns: string[];
  typicalProblems: string[];
  examples: string[];
  plotConfig: FormulaPlotConfig | null;
  variables: Array<{
    id: string;
    symbol: string;
    name: string;
    description: string;
    unit: string | null;
    sortOrder: number;
  }>;
  reviewItems: Array<{
    id: string;
    type: "recall" | "recognition" | "application";
    prompt: string;
    answer: string;
    explanation: string | null;
    difficulty: number;
  }>;
  memoryHooks: MemoryHookRecord[];
};

export type FormulaRelationDetail = {
  id: string;
  relationType: "prerequisite" | "related" | "confusable" | "application_of";
  note: string | null;
  formula: FormulaSummary;
};
