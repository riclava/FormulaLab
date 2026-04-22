export type FormulaSummary = {
  id: string;
  slug: string;
  title: string;
  expressionLatex: string;
  domain: string;
  subdomain: string | null;
  oneLineUse: string;
  difficulty: number;
  tags: string[];
  reviewItemCount: number;
  memoryHookCount: number;
};

export type FormulaDetail = FormulaSummary & {
  meaning: string;
  intuition: string | null;
  derivation: string | null;
  useConditions: string[];
  antiPatterns: string[];
  typicalProblems: string[];
  examples: string[];
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
  memoryHooks: Array<{
    id: string;
    source: "ai_suggested" | "user_created";
    type:
      | "analogy"
      | "scenario"
      | "visual"
      | "mnemonic"
      | "contrast"
      | "personal";
    content: string;
    prompt: string | null;
  }>;
};

export type FormulaRelationDetail = {
  id: string;
  relationType: "prerequisite" | "related" | "confusable" | "application_of";
  note: string | null;
  formula: FormulaSummary;
};
