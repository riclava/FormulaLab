import type { MemoryHookType } from "@/types/memory-hook";

export const MEMORY_HOOK_TYPE_LABELS: Record<MemoryHookType, string> = {
  analogy: "类比联想",
  scenario: "场景联想",
  visual: "图像联想",
  mnemonic: "口诀联想",
  contrast: "对比联想",
  personal: "个人联想",
};

export const GUIDED_MEMORY_PROMPTS = [
  "你可以把这个公式联想到什么？",
  "它像哪个你已经熟悉的公式？",
  "它通常出现在什么题型里？",
  "有没有一个画面、口诀或生活场景能帮你想起它？",
] as const;

export function formatMemoryHookLastUsed(lastUsedAt: string | null) {
  if (!lastUsedAt) {
    return "还没在复习里用过";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(lastUsedAt));
}

