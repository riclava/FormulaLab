"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Network,
  PenSquare,
  Sparkles,
} from "lucide-react";

import { LatexRenderer } from "@/components/formula/latex-renderer";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { FormulaDetail, FormulaRelationDetail } from "@/types/formula";

type MemoryHook = FormulaDetail["memoryHooks"][number];

type FocusSection =
  | "use"
  | "non-use"
  | "anti-patterns"
  | "hooks"
  | "relations"
  | "examples"
  | "derivation";

export type { FocusSection };

export function FormulaDetailView({
  formulaIdOrSlug,
  initialFormula,
  initialRelations,
  initialHooks,
  focusSection,
  footer,
  compact = false,
  selectableHooks = false,
}: {
  formulaIdOrSlug: string;
  initialFormula?: FormulaDetail;
  initialRelations?: FormulaRelationDetail[];
  initialHooks?: MemoryHook[];
  focusSection?: FocusSection;
  footer?: React.ReactNode;
  compact?: boolean;
  selectableHooks?: boolean;
}) {
  const [formula, setFormula] = useState<FormulaDetail | null>(initialFormula ?? null);
  const [relations, setRelations] = useState<FormulaRelationDetail[]>(
    initialRelations ?? [],
  );
  const [hooks, setHooks] = useState<MemoryHook[]>(initialHooks ?? initialFormula?.memoryHooks ?? []);
  const [customHook, setCustomHook] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedHookId, setSelectedHookId] = useState<string | null>(null);
  const [selectionMessage, setSelectionMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    let ignore = false;

    async function loadBundle() {
      try {
        const [formulaResponse, relationsResponse, hooksResponse] = await Promise.all([
          fetch(`/api/formulas/${formulaIdOrSlug}`),
          fetch(`/api/formulas/${formulaIdOrSlug}/relations`),
          fetch(`/api/formulas/${formulaIdOrSlug}/memory-hooks`),
        ]);
        const [formulaPayload, relationsPayload, hooksPayload] = await Promise.all([
          formulaResponse.json() as Promise<{ data?: FormulaDetail; error?: string }>,
          relationsResponse.json() as Promise<{ data?: FormulaRelationDetail[]; error?: string }>,
          hooksResponse.json() as Promise<{ data?: MemoryHook[]; error?: string }>,
        ]);

        if (!formulaResponse.ok || !formulaPayload.data) {
          throw new Error(formulaPayload.error ?? "公式详情加载失败");
        }

        if (!ignore) {
          setFormula(formulaPayload.data);
          setRelations(relationsResponse.ok && relationsPayload.data ? relationsPayload.data : []);
          setHooks(hooksResponse.ok && hooksPayload.data ? hooksPayload.data : formulaPayload.data.memoryHooks);
          setLoadError(null);
        }
      } catch (error) {
        if (!ignore) {
          setLoadError(error instanceof Error ? error.message : "公式详情加载失败");
        }
      }
    }

    if (!initialFormula) {
      loadBundle();
      return () => {
        ignore = true;
      };
    }

    loadBundle();
    return () => {
      ignore = true;
    };
  }, [formulaIdOrSlug, initialFormula]);

  useEffect(() => {
    if (!focusSection) {
      return;
    }

    const timer = window.setTimeout(() => {
      sectionRefs.current[focusSection]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [focusSection, formula?.id]);

  const userHooks = useMemo(
    () => hooks.filter((hook) => hook.source === "user_created"),
    [hooks],
  );
  const suggestedHooks = useMemo(
    () => hooks.filter((hook) => hook.source === "ai_suggested"),
    [hooks],
  );

  function handleHookSelected(hook: MemoryHook) {
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/formulas/${formulaIdOrSlug}/memory-hooks/${hook.id}/select`,
          {
            method: "POST",
          },
        );
        const payload = (await response.json()) as {
          data?: MemoryHook;
          error?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "记忆钩子选用失败");
        }

        setSelectedHookId(payload.data.id);
        setSelectionMessage("这条记忆钩子已被设为优先提示。");
        setHooks((previous) => {
          const nextHooks = previous.filter((candidate) => candidate.id !== payload.data!.id);
          return [payload.data!, ...nextHooks];
        });
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "记忆钩子选用失败");
      }
    });
  }

  if (loadError) {
    return (
      <div className="rounded-lg border bg-background p-6 shadow-sm">
        <Badge variant="destructive" className="w-fit">
          详情不可用
        </Badge>
        <p className="mt-3 text-sm text-muted-foreground">{loadError}</p>
      </div>
    );
  }

  if (!formula) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-background p-6 shadow-sm">
        <Loader2 data-icon="inline-start" className="animate-spin" />
        <span className="text-sm text-muted-foreground">正在加载公式详情...</span>
      </div>
    );
  }

  return (
    <article className="flex flex-col gap-6">
      <section className="rounded-lg border bg-background p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{formula.domain}</Badge>
          {formula.subdomain ? <Badge variant="secondary">{formula.subdomain}</Badge> : null}
          <Badge variant="outline">补弱详情</Badge>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <h2 className={cn("font-semibold tracking-tight", compact ? "text-2xl" : "text-3xl")}>
            {formula.title}
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {formula.oneLineUse}
          </p>
          <LatexRenderer block expression={formula.expressionLatex} />
        </div>
      </section>

      <QuickActions
        onJump={(section) => {
          sectionRefs.current[section]?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      <div className={cn("grid gap-6", compact ? "xl:grid-cols-1" : "xl:grid-cols-[minmax(0,1fr)_22rem]")}>
        <div className="flex min-w-0 flex-col gap-6">
          <DetailSection
            sectionRef={(node) => {
              sectionRefs.current.use = node;
            }}
            focused={focusSection === "use"}
            icon={CheckCircle2}
            title="什么时候用"
          >
            <BulletList items={formula.useConditions} tone="positive" />
          </DetailSection>

          <DetailSection
            sectionRef={(node) => {
              sectionRefs.current["non-use"] = node;
            }}
            focused={focusSection === "non-use"}
            icon={AlertTriangle}
            title="什么时候不能用"
          >
            <BulletList items={formula.nonUseConditions} tone="warning" />
          </DetailSection>

          <DetailSection icon={BookOpen} title="变量说明">
            <div className="grid gap-3">
              {formula.variables.map((variable) => (
                <div key={variable.id} className="rounded-lg border p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <code className="rounded bg-muted px-2 py-1 text-xs">{variable.symbol}</code>
                    <span className="text-sm font-medium">{variable.name}</span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {variable.description}
                  </p>
                </div>
              ))}
            </div>
          </DetailSection>

          <DetailSection icon={BookOpen} title="典型题型">
            <BulletList items={formula.typicalProblems} tone="neutral" />
          </DetailSection>

          <DetailSection
            sectionRef={(node) => {
              sectionRefs.current["anti-patterns"] = node;
            }}
            focused={focusSection === "anti-patterns"}
            icon={AlertTriangle}
            title="常见误用"
          >
            <BulletList items={formula.antiPatterns} tone="warning" />
          </DetailSection>

          <DetailSection
            sectionRef={(node) => {
              sectionRefs.current.hooks = node;
            }}
            focused={focusSection === "hooks"}
            icon={Lightbulb}
            title="记忆联想"
          >
            <div className="flex flex-col gap-4">
              {userHooks.length > 0 ? (
                <div className="grid gap-3">
                  <p className="text-sm font-medium text-foreground">你的个人记忆钩子</p>
                  {userHooks.map((hook) => (
                    <div key={hook.id} className="rounded-lg border bg-muted/30 p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="secondary">个人</Badge>
                        <span className="text-xs text-muted-foreground">{hook.type}</span>
                      </div>
                      <p className="text-sm leading-6">{hook.content}</p>
                      {selectableHooks ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant={selectedHookId === hook.id ? "secondary" : "outline"}
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleHookSelected(hook)}
                          >
                            {selectedHookId === hook.id ? "已设为默认提示" : "选为默认提示"}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="grid gap-3">
                <p className="text-sm font-medium text-foreground">AI 推荐联想</p>
                {suggestedHooks.length > 0 ? (
                  suggestedHooks.map((hook) => (
                    <div key={hook.id} className="rounded-lg border p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="outline">
                          <Sparkles data-icon="inline-start" />
                          AI
                        </Badge>
                        <span className="text-xs text-muted-foreground">{hook.type}</span>
                      </div>
                      <p className="text-sm leading-6">{hook.content}</p>
                      {hook.prompt ? (
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {hook.prompt}
                        </p>
                      ) : null}
                      {selectableHooks ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant={selectedHookId === hook.id ? "secondary" : "outline"}
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleHookSelected(hook)}
                          >
                            {selectedHookId === hook.id ? "已设为默认提示" : "选为默认提示"}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    当前还没有推荐联想，你可以先创建一条自己的记忆钩子。
                  </div>
                )}
              </div>

              {selectionMessage ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-900">
                  {selectionMessage}
                </div>
              ) : null}

              <Separator />

              <div className="grid gap-3">
                <Label htmlFor="custom-memory-hook">创建个人记忆钩子</Label>
                <Textarea
                  id="custom-memory-hook"
                  placeholder="写下一个能帮你在下次更快想起这个公式的画面、口诀、场景或对比。"
                  value={customHook}
                  onChange={(event) => setCustomHook(event.target.value)}
                />
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    disabled={isPending || !customHook.trim()}
                    onClick={() => {
                      startTransition(async () => {
                        try {
                          const response = await fetch(
                            `/api/formulas/${formula.slug}/memory-hooks`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                content: customHook.trim(),
                              }),
                            },
                          );
                          const payload = (await response.json()) as {
                            data?: MemoryHook;
                            error?: string;
                          };

                          if (!response.ok || !payload.data) {
                            throw new Error(payload.error ?? "记忆钩子保存失败");
                          }

                          const selectResponse = await fetch(
                            `/api/formulas/${formula.slug}/memory-hooks/${payload.data.id}/select`,
                            {
                              method: "POST",
                            },
                          );
                          const selectPayload = (await selectResponse.json()) as {
                            data?: MemoryHook;
                            error?: string;
                          };

                          if (!selectResponse.ok || !selectPayload.data) {
                            throw new Error(
                              selectPayload.error ?? "记忆钩子已保存，但默认提示设置失败",
                            );
                          }

                          setHooks((previous) => {
                            const nextHooks = previous.filter(
                              (hook) => hook.id !== selectPayload.data!.id,
                            );
                            return [selectPayload.data!, ...nextHooks];
                          });
                          setCustomHook("");
                          setSelectedHookId(selectPayload.data.id);
                          setSelectionMessage("新的记忆钩子已保存，并设为默认提示。");
                        } catch (error) {
                          setLoadError(
                            error instanceof Error ? error.message : "记忆钩子保存失败",
                          );
                        }
                      });
                    }}
                  >
                    <PenSquare data-icon="inline-start" />
                    保存个人联想
                  </Button>
                </div>
              </div>
            </div>
          </DetailSection>

          <DetailSection
            sectionRef={(node) => {
              sectionRefs.current.examples = node;
            }}
            focused={focusSection === "examples"}
            icon={BookOpen}
            title="例题"
          >
            <BulletList items={formula.examples} tone="neutral" />
          </DetailSection>

          <DetailSection
            sectionRef={(node) => {
              sectionRefs.current.derivation = node;
            }}
            focused={focusSection === "derivation"}
            icon={BookOpen}
            title="推导过程"
          >
            <p className="text-sm leading-6 text-muted-foreground">
              {formula.derivation ?? "当前还没有补充推导过程。"}
            </p>
          </DetailSection>
        </div>

        <div className="flex flex-col gap-6">
          <DetailSection
            sectionRef={(node) => {
              sectionRefs.current.relations = node;
            }}
            focused={focusSection === "relations"}
            icon={Network}
            title="关联公式"
          >
            <div className="grid gap-3">
              {relations.length > 0 ? (
                relations.map((relation) => (
                  <div key={relation.id} className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="secondary">
                        {relationTypeLabel(relation.relationType)}
                      </Badge>
                      <span className="text-sm font-medium">{relation.formula.title}</span>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {relation.note ?? relation.formula.oneLineUse}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  当前还没有补充关联公式。
                </div>
              )}
            </div>
          </DetailSection>

          <DetailSection icon={BookOpen} title="公式含义">
            <p className="text-sm leading-6 text-muted-foreground">{formula.meaning}</p>
            {formula.intuition ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {formula.intuition}
              </p>
            ) : null}
          </DetailSection>
        </div>
      </div>

      {footer ? <div className="rounded-lg border bg-background p-4 shadow-sm">{footer}</div> : null}
    </article>
  );
}

function QuickActions({
  onJump,
}: {
  onJump: (section: FocusSection) => void;
}) {
  return (
    <section className="flex flex-wrap gap-2">
      <button
        type="button"
        className={buttonVariants({ variant: "outline", size: "sm" })}
        onClick={() => onJump("use")}
      >
        看适用条件
      </button>
      <button
        type="button"
        className={buttonVariants({ variant: "outline", size: "sm" })}
        onClick={() => onJump("anti-patterns")}
      >
        看常见误用
      </button>
      <button
        type="button"
        className={buttonVariants({ variant: "outline", size: "sm" })}
        onClick={() => onJump("hooks")}
      >
        建立记忆钩子
      </button>
      <button
        type="button"
        className={buttonVariants({ variant: "outline", size: "sm" })}
        onClick={() => onJump("relations")}
      >
        看关联公式
      </button>
    </section>
  );
}

const DetailSection = ({
  icon: Icon,
  title,
  children,
  focused,
  sectionRef,
}: {
  icon: typeof BookOpen;
  title: string;
  children: React.ReactNode;
  focused?: boolean;
  sectionRef?: (node: HTMLElement | null) => void;
}) => (
  <section
    ref={sectionRef}
    className={cn(
      "rounded-lg border bg-background p-5 shadow-sm transition-shadow",
      focused && "ring-2 ring-primary/30 shadow-md",
    )}
  >
    <div className="mb-4 flex items-center gap-2">
      <Icon data-icon="inline-start" />
      <h3 className="font-medium">{title}</h3>
    </div>
    {children}
  </section>
);

function BulletList({
  items,
  tone,
}: {
  items: string[];
  tone: "positive" | "warning" | "neutral";
}) {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li
          key={item}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm leading-6",
            tone === "positive" && "border-emerald-200 bg-emerald-50/60",
            tone === "warning" && "border-amber-200 bg-amber-50/70",
            tone === "neutral" && "border-border bg-muted/20",
          )}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function relationTypeLabel(relationType: FormulaRelationDetail["relationType"]) {
  if (relationType === "prerequisite") {
    return "前置公式";
  }

  if (relationType === "confusable") {
    return "易混淆";
  }

  if (relationType === "application_of") {
    return "后续应用";
  }

  return "相关公式";
}
