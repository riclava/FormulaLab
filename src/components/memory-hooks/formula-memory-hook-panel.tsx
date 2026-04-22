"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Check,
  Lightbulb,
  Loader2,
  Pencil,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  formatMemoryHookLastUsed,
  GUIDED_MEMORY_PROMPTS,
  MEMORY_HOOK_TYPE_LABELS,
} from "@/lib/memory-hooks";
import { cn } from "@/lib/utils";
import type { MemoryHookRecord, MemoryHookType } from "@/types/memory-hook";

const MEMORY_HOOK_TYPES: MemoryHookType[] = [
  "analogy",
  "scenario",
  "visual",
  "mnemonic",
  "contrast",
  "personal",
];

export function FormulaMemoryHookPanel({
  formulaIdOrSlug,
  initialHooks = [],
  selectableHooks = false,
  compact = false,
}: {
  formulaIdOrSlug: string;
  initialHooks?: MemoryHookRecord[];
  selectableHooks?: boolean;
  compact?: boolean;
}) {
  const [hooks, setHooks] = useState<MemoryHookRecord[]>(initialHooks);
  const [draftContent, setDraftContent] = useState("");
  const [draftPrompt, setDraftPrompt] = useState<string>("");
  const [draftType, setDraftType] = useState<MemoryHookType>("personal");
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<string[]>([]);
  const [editingHookId, setEditingHookId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [editType, setEditType] = useState<MemoryHookType>("personal");
  const [selectedHookId, setSelectedHookId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let ignore = false;

    async function loadHooks() {
      try {
        const response = await fetch(`/api/formulas/${formulaIdOrSlug}/memory-hooks`);
        const payload = (await response.json()) as {
          data?: MemoryHookRecord[];
          error?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "记忆钩子加载失败");
        }

        if (!ignore) {
          setHooks(payload.data);
          setError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(
            loadError instanceof Error ? loadError.message : "记忆钩子加载失败",
          );
        }
      }
    }

    loadHooks();

    return () => {
      ignore = true;
    };
  }, [formulaIdOrSlug]);

  const personalHooks = useMemo(
    () => hooks.filter((hook) => hook.source === "user_created"),
    [hooks],
  );
  const aiHooks = useMemo(
    () =>
      hooks.filter(
        (hook) =>
          hook.source === "ai_suggested" &&
          !dismissedSuggestionIds.includes(hook.id),
      ),
    [dismissedSuggestionIds, hooks],
  );

  function syncHook(updatedHook: MemoryHookRecord) {
    setHooks((previous) => {
      const nextHooks = previous.filter((hook) => hook.id !== updatedHook.id);
      return [updatedHook, ...nextHooks];
    });
  }

  function createPersonalHook() {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/formulas/${formulaIdOrSlug}/memory-hooks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: draftContent.trim(),
            prompt: draftPrompt.trim() || undefined,
            type: draftType,
          }),
        });
        const payload = (await response.json()) as {
          data?: MemoryHookRecord;
          error?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "个人联想保存失败");
        }

        syncHook(payload.data);
        setDraftContent("");
        setDraftPrompt("");
        setDraftType("personal");
        setMessage("个人联想已保存。");
        setError(null);

        if (selectableHooks) {
          await chooseAsDefault(payload.data);
        }
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "个人联想保存失败");
      }
    });
  }

  async function chooseAsDefault(hook: MemoryHookRecord) {
    const response = await fetch(
      `/api/formulas/${formulaIdOrSlug}/memory-hooks/${hook.id}/select`,
      {
        method: "POST",
      },
    );
    const payload = (await response.json()) as {
      data?: MemoryHookRecord;
      error?: string;
    };

    if (!response.ok || !payload.data) {
      throw new Error(payload.error ?? "默认提示设置失败");
    }

    syncHook(payload.data);
    setSelectedHookId(payload.data.id);
    setMessage("这条联想会优先作为后续提示。");
    setError(null);
  }

  function saveAiSuggestion(hook: MemoryHookRecord, overrides?: {
    content?: string;
    prompt?: string;
    type?: MemoryHookType;
  }) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/formulas/${formulaIdOrSlug}/memory-hooks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceHookId: hook.id,
            content: overrides?.content ?? hook.content,
            prompt: overrides?.prompt ?? hook.prompt ?? undefined,
            type: overrides?.type ?? hook.type,
          }),
        });
        const payload = (await response.json()) as {
          data?: MemoryHookRecord;
          error?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "AI 联想保存失败");
        }

        syncHook(payload.data);
        setDismissedSuggestionIds((previous) =>
          previous.filter((id) => id !== hook.id),
        );
        setEditingHookId(null);
        setEditContent("");
        setEditPrompt("");
        setEditType("personal");
        setMessage("AI 候选已转成你的个人联想。");
        setError(null);

        if (selectableHooks) {
          await chooseAsDefault(payload.data);
        }
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "AI 联想保存失败");
      }
    });
  }

  function updateHook(hookId: string) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/memory-hooks/${hookId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: editContent.trim(),
            prompt: editPrompt.trim() || null,
            type: editType,
          }),
        });
        const payload = (await response.json()) as {
          data?: MemoryHookRecord;
          error?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "记忆钩子更新失败");
        }

        syncHook(payload.data);
        setEditingHookId(null);
        setEditContent("");
        setEditPrompt("");
        setEditType("personal");
        setMessage("个人联想已更新。");
        setError(null);
      } catch (updateError) {
        setError(
          updateError instanceof Error ? updateError.message : "记忆钩子更新失败",
        );
      }
    });
  }

  function deleteHook(hookId: string) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/memory-hooks/${hookId}`, {
          method: "DELETE",
        });
        const payload = (await response.json()) as {
          data?: { id: string };
          error?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "记忆钩子删除失败");
        }

        setHooks((previous) => previous.filter((hook) => hook.id !== hookId));
        if (selectedHookId === hookId) {
          setSelectedHookId(null);
        }
        setMessage("个人联想已删除。");
        setError(null);
      } catch (deleteError) {
        setError(
          deleteError instanceof Error ? deleteError.message : "记忆钩子删除失败",
        );
      }
    });
  }

  function suggestHooks() {
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/formulas/${formulaIdOrSlug}/memory-hooks/suggest`,
          {
            method: "POST",
          },
        );
        const payload = (await response.json()) as {
          data?: MemoryHookRecord[];
          error?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "候选联想生成失败");
        }

        setHooks((previous) => mergeHooks(previous, payload.data!));
        setDismissedSuggestionIds([]);
        setMessage("AI 候选已刷新。");
        setError(null);
      } catch (suggestError) {
        setError(
          suggestError instanceof Error ? suggestError.message : "候选联想生成失败",
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-900">
          {message}
        </div>
      ) : null}

      <div className={cn("grid gap-4", compact ? "lg:grid-cols-1" : "lg:grid-cols-[1.1fr_0.9fr]")}>
        <section className="rounded-lg border bg-background p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lightbulb data-icon="inline-start" />
              <h4 className="font-medium">你的个人联想</h4>
            </div>
            <Badge variant="secondary">{personalHooks.length} 条</Badge>
          </div>

          <div className="grid gap-3">
            {personalHooks.length > 0 ? (
              personalHooks.map((hook) => (
                <div key={hook.id} className="rounded-lg border bg-muted/20 p-3">
                  {editingHookId === hook.id ? (
                    <div className="grid gap-3">
                      <MemoryHookTypeField
                        value={editType}
                        onChange={(value) => setEditType(value)}
                      />
                      <div className="grid gap-2">
                        <Label htmlFor={`memory-hook-edit-${hook.id}`}>联想内容</Label>
                        <Textarea
                          id={`memory-hook-edit-${hook.id}`}
                          value={editContent}
                          onChange={(event) => setEditContent(event.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`memory-hook-prompt-${hook.id}`}>生成线索</Label>
                        <Input
                          id={`memory-hook-prompt-${hook.id}`}
                          value={editPrompt}
                          onChange={(event) => setEditPrompt(event.target.value)}
                          placeholder="这条联想是从哪个问题或场景出发写下的？"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={isPending || !editContent.trim()}
                          onClick={() => updateHook(hook.id)}
                        >
                          <Check data-icon="inline-start" />
                          保存修改
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingHookId(null);
                            setEditContent("");
                            setEditPrompt("");
                            setEditType("personal");
                          }}
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{MEMORY_HOOK_TYPE_LABELS[hook.type]}</Badge>
                        <span className="text-xs text-muted-foreground">
                          已使用 {hook.usedCount} 次
                        </span>
                        <span className="text-xs text-muted-foreground">
                          有帮助 {hook.helpfulCount} 次
                        </span>
                      </div>
                      <p className="text-sm leading-6">{hook.content}</p>
                      {hook.prompt ? (
                        <p className="text-xs leading-5 text-muted-foreground">
                          来自提示：{hook.prompt}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        最近使用：{formatMemoryHookLastUsed(hook.lastUsedAt)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectableHooks ? (
                          <Button
                            type="button"
                            size="sm"
                            variant={selectedHookId === hook.id ? "secondary" : "outline"}
                            disabled={isPending}
                            onClick={() => {
                              startTransition(async () => {
                                try {
                                  await chooseAsDefault(hook);
                                } catch (selectionError) {
                                  setError(
                                    selectionError instanceof Error
                                      ? selectionError.message
                                      : "默认提示设置失败",
                                  );
                                }
                              });
                            }}
                          >
                            {selectedHookId === hook.id ? "默认提示" : "设为默认提示"}
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingHookId(hook.id);
                            setEditContent(hook.content);
                            setEditPrompt(hook.prompt ?? "");
                            setEditType(hook.type);
                          }}
                        >
                          <Pencil data-icon="inline-start" />
                          编辑
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => deleteHook(hook.id)}
                        >
                          <Trash2 data-icon="inline-start" />
                          删除
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                还没有个人联想。你可以从 AI 候选里保存一条，或直接写下自己的记忆钩子。
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border bg-background p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles data-icon="inline-start" />
              <h4 className="font-medium">AI 推荐候选</h4>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={suggestHooks}
            >
              {isPending ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <RefreshCw data-icon="inline-start" />
              )}
              刷新候选
            </Button>
          </div>

          <div className="grid gap-3">
            {aiHooks.length > 0 ? (
              aiHooks.map((hook) => (
                <AiSuggestionCard
                  key={hook.id}
                  hook={hook}
                  isPending={isPending}
                  onSave={() => saveAiSuggestion(hook)}
                  onDismiss={() =>
                    setDismissedSuggestionIds((previous) => [...previous, hook.id])
                  }
                  onSaveEdited={(nextDraft) => saveAiSuggestion(hook, nextDraft)}
                />
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                当前没有可用候选。可以点“刷新候选”，或直接写下自己的个人联想。
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-lg border bg-background p-4">
        <div className="mb-4 flex items-center gap-2">
          <Pencil data-icon="inline-start" />
          <h4 className="font-medium">创建个人联想</h4>
        </div>

        <div className="mb-4 grid gap-2">
          <p className="text-sm text-muted-foreground">
            不必写得很“正确”，只要能帮你下次更快回忆出来就行。
          </p>
          <div className="flex flex-wrap gap-2">
            {GUIDED_MEMORY_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="rounded-lg border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted"
                onClick={() => {
                  setDraftPrompt(prompt);
                  setMessage(`已选中提示：${prompt}`);
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <MemoryHookTypeField value={draftType} onChange={setDraftType} />
          <div className="grid gap-2">
            <Label htmlFor={`memory-hook-create-${formulaIdOrSlug}`}>联想内容</Label>
            <Textarea
              id={`memory-hook-create-${formulaIdOrSlug}`}
              placeholder="例如：看到检测阳性就想到先验乘似然，再除总证据。"
              value={draftContent}
              onChange={(event) => setDraftContent(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`memory-hook-create-prompt-${formulaIdOrSlug}`}>
              这条联想来自哪个引导问题
            </Label>
            <Input
              id={`memory-hook-create-prompt-${formulaIdOrSlug}`}
              value={draftPrompt}
              onChange={(event) => setDraftPrompt(event.target.value)}
              placeholder="可留空，或写成“它通常出现在什么题型里？”"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={isPending || !draftContent.trim()}
              onClick={createPersonalHook}
            >
              <Lightbulb data-icon="inline-start" />
              保存为下次提示
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function AiSuggestionCard({
  hook,
  isPending,
  onSave,
  onSaveEdited,
  onDismiss,
}: {
  hook: MemoryHookRecord;
  isPending: boolean;
  onSave: () => void;
  onSaveEdited: (draft: {
    content?: string;
    prompt?: string;
    type?: MemoryHookType;
  }) => void;
  onDismiss: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(hook.content);
  const [prompt, setPrompt] = useState(hook.prompt ?? "");
  const [type, setType] = useState<MemoryHookType>(hook.type);

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge variant="outline">{MEMORY_HOOK_TYPE_LABELS[hook.type]}</Badge>
        <span className="text-xs text-muted-foreground">
          已被标记有帮助 {hook.helpfulCount} 次
        </span>
      </div>

      {isEditing ? (
        <div className="grid gap-3">
          <MemoryHookTypeField value={type} onChange={setType} />
          <Textarea value={content} onChange={(event) => setContent(event.target.value)} />
          <Input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="这条候选想帮助你从哪个角度想起公式？"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isPending || !content.trim()}
              onClick={() => onSaveEdited({ content: content.trim(), prompt: prompt.trim(), type })}
            >
              保存为个人联想
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(false)}
            >
              取消
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="text-sm leading-6">{hook.content}</p>
          {hook.prompt ? (
            <p className="text-xs leading-5 text-muted-foreground">{hook.prompt}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={isPending} onClick={onSave}>
              <Check data-icon="inline-start" />
              直接保存
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              <Pencil data-icon="inline-start" />
              编辑后保存
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
              暂不采用
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MemoryHookTypeField({
  value,
  onChange,
}: {
  value: MemoryHookType;
  onChange: (value: MemoryHookType) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>联想类型</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as MemoryHookType)}
        className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {MEMORY_HOOK_TYPES.map((type) => (
          <option key={type} value={type}>
            {MEMORY_HOOK_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
    </div>
  );
}

function mergeHooks(
  previousHooks: MemoryHookRecord[],
  nextHooks: MemoryHookRecord[],
) {
  const byId = new Map(previousHooks.map((hook) => [hook.id, hook]));

  for (const hook of nextHooks) {
    byId.set(hook.id, hook);
  }

  return Array.from(byId.values()).sort((left, right) => {
    if (left.source !== right.source) {
      return left.source === "user_created" ? -1 : 1;
    }

    if (left.helpfulCount !== right.helpfulCount) {
      return right.helpfulCount - left.helpfulCount;
    }

    return right.usedCount - left.usedCount;
  });
}

