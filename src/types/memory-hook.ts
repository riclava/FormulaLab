export type MemoryHookSource = "ai_suggested" | "user_created";

export type MemoryHookType =
  | "analogy"
  | "scenario"
  | "visual"
  | "mnemonic"
  | "contrast"
  | "personal";

export type MemoryHookRecord = {
  id: string;
  source: MemoryHookSource;
  type: MemoryHookType;
  content: string;
  prompt: string | null;
  usedCount: number;
  helpfulCount: number;
  lastUsedAt: string | null;
};

