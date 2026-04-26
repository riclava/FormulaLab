"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { useMemo, useState, useTransition } from "react";
import { Loader2, Plus, Save, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FormulaPlotConfig } from "@/types/formula";

type FormulaVariableInput = {
  symbol: string;
  name: string;
  description: string;
  unit?: string | null;
};

type FormulaReviewItemInput = {
  type: "recall" | "recognition" | "application";
  prompt: string;
  answer: string;
  explanation?: string | null;
  difficulty: number;
};

type FormulaRelationInput = {
  toSlug: string;
  relationType: "prerequisite" | "related" | "confusable" | "application_of";
  note?: string | null;
};

type GeneratedFormulaDraft = {
  title: string;
  expressionLatex: string;
  domain: string;
  subdomain: string;
  oneLineUse: string;
  meaning: string;
  derivation: string;
  difficulty: number;
  tags: string[];
  useConditions: string[];
  nonUseConditions: string[];
  antiPatterns: string[];
  typicalProblems: string[];
  examples: string[];
};

export type OfficialFormulaFormValue = {
  slug: string;
  title: string;
  expressionLatex: string;
  domain: string;
  subdomain: string | null;
  oneLineUse: string;
  meaning: string;
  intuition: string | null;
  derivation: string | null;
  useConditions: string[];
  nonUseConditions: string[];
  antiPatterns: string[];
  typicalProblems: string[];
  examples: string[];
  plotConfig: unknown;
  difficulty: number;
  tags: string[];
  memoryHook?: string;
  variables: FormulaVariableInput[];
  reviewItems: FormulaReviewItemInput[];
  relations: FormulaRelationInput[];
};

export type RelationOption = {
  slug: string;
  title: string;
};

export function OfficialFormulaForm({
  variant = "official",
  mode,
  initialValue,
  relationOptions = [],
}: {
  variant?: "official" | "custom";
  mode: "create" | "edit";
  initialValue?: OfficialFormulaFormValue;
  relationOptions?: RelationOption[];
}) {
  const router = useRouter();
  const [value, setValue] = useState<OfficialFormulaFormValue>(
    initialValue ?? createEmptyFormula(variant),
  );
  const [draftPrompt, setDraftPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isDraftPending, setIsDraftPending] = useState(false);
  const [isPlotConfigPending, setIsPlotConfigPending] = useState(false);
  const [customDetailsOpen, setCustomDetailsOpen] = useState(
    variant === "official" || Boolean(initialValue),
  );
  const [isPending, startTransition] = useTransition();
  const hasGeneratedDraft =
    value.title.trim().length > 0 ||
    value.expressionLatex.trim().length > 0 ||
    value.oneLineUse.trim().length > 0;
  const relationSlugs = useMemo(
    () => new Set(relationOptions.map((item) => item.slug)),
    [relationOptions],
  );
  const validationIssues = useMemo(
    () => validateFormula(value, relationSlugs, variant),
    [value, relationSlugs, variant],
  );

  return (
    <form
      className="grid gap-4 rounded-lg border bg-background p-4 shadow-sm md:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        submitForm();
      }}
    >
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold">
          {variant === "custom"
            ? mode === "create"
              ? "新建我的公式"
              : "编辑我的公式"
            : mode === "create"
              ? "新增官方公式"
              : "编辑官方公式"}
        </h2>
        {variant === "official" ? (
          <p className="text-sm leading-5 text-muted-foreground">
            保存会直接写入官方公式库数据库记录；变量、复习题和关系均可结构化维护。
          </p>
        ) : null}
      </div>

      <section
        className={
          variant === "custom"
            ? "grid gap-4 rounded-lg border bg-muted/20 p-4 shadow-sm md:p-5"
            : "grid gap-3 rounded-lg border bg-muted/20 p-3"
        }
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="grid gap-1">
            <Label htmlFor="admin-formula-draft-prompt">
              {variant === "custom" ? "粘贴笔记或题目" : "AI 草稿填充"}
            </Label>
            <p className="text-sm leading-5 text-muted-foreground">
              {variant === "custom"
                ? mode === "create"
                  ? "大部分信息可以交给 AI 整理。生成后确认标题、公式和用途，再创建到你的训练库。"
                  : "可以粘贴新的笔记或错题，让 AI 重新整理后再保存到你的训练库。"
                : "输入公式名、题面、课堂笔记或学习目标，AI 会填充核心字段和复习题草稿，保存前仍需人工检查。"}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={isPending || isDraftPending || !draftPrompt.trim()}
            onClick={generateDraft}
          >
            {isDraftPending ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Sparkles data-icon="inline-start" />
            )}
            用 AI 填充
          </Button>
        </div>
        <Textarea
          id="admin-formula-draft-prompt"
          value={draftPrompt}
          onChange={(event) => setDraftPrompt(event.target.value)}
          placeholder="例如：二项分布，n 次独立伯努利试验中成功 k 次的概率，补充适用条件、误用和复习题。"
          className={variant === "custom" ? "min-h-32" : "min-h-20"}
        />
      </section>

      {variant === "custom" && hasGeneratedDraft ? (
        <section className="grid gap-4 rounded-lg border bg-background p-4 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="grid gap-1">
              <h3 className="font-medium">AI 生成内容预览</h3>
              <p className="text-sm text-muted-foreground">
                先看清楚 AI 生成了什么。核心字段可直接修改，完整细节可展开继续编辑。
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCustomDetailsOpen((current) => !current)}
            >
              {customDetailsOpen ? "收起详情" : "编辑详情"}
            </Button>
          </div>

          <div className="grid gap-2 rounded-lg border bg-muted/20 p-3">
            <div className="grid gap-2 md:grid-cols-3">
              <PreviewMetric label="知识域" value={value.domain || "未填写"} />
              <PreviewMetric label="难度" value={`难度 ${value.difficulty}`} />
              <PreviewMetric
                label="训练内容"
                value={`${value.variables.length} 个变量 / ${value.reviewItems.length} 道题`}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field
              label="标题"
              value={value.title}
              onChange={(next) => setValue((current) => ({ ...current, title: next }))}
              placeholder="贝叶斯定理"
              required
            />
            <Field
              label="LaTeX 表达式"
              value={value.expressionLatex}
              onChange={(next) =>
                setValue((current) => ({ ...current, expressionLatex: next }))
              }
              required
            />
          </div>
          <Field
            label="一句话用途"
            value={value.oneLineUse}
            onChange={(next) =>
              setValue((current) => ({ ...current, oneLineUse: next }))
            }
            required
          />

          <div className="grid gap-3 md:grid-cols-3">
            <PreviewList title="适用条件" items={value.useConditions} />
            <PreviewList title="常见误用" items={value.antiPatterns} />
            <PreviewList title="典型题型" items={value.typicalProblems} />
          </div>

          {value.reviewItems.length > 0 ? (
            <div className="grid gap-2 rounded-lg border bg-muted/10 p-3">
              <h4 className="text-sm font-medium">复习题草稿</h4>
              <div className="grid gap-2">
                {value.reviewItems.map((item, index) => (
                  <div key={`${item.type}-${index}`} className="rounded-md bg-background px-3 py-2 text-sm">
                    <p className="font-medium">
                      {reviewTypeLabel(item.type)}：{item.prompt || "未填写题目"}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      答案：{item.answer || "未填写答案"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <div
        className={
          variant === "custom" && hasGeneratedDraft
            ? "hidden"
            : "grid gap-3 md:grid-cols-6"
        }
      >
        {variant === "official" ? (
          <Field
            label="Slug"
            value={value.slug}
            onChange={(next) => setValue((current) => ({ ...current, slug: next }))}
            placeholder="bayes-theorem"
            required
            containerClassName="md:col-span-2"
          />
        ) : null}
        <Field
          label="标题"
          value={value.title}
          onChange={(next) => setValue((current) => ({ ...current, title: next }))}
          placeholder="贝叶斯定理"
          required
          containerClassName={variant === "official" ? "md:col-span-2" : "md:col-span-3"}
        />
        <Field
          label="知识域"
          value={value.domain}
          onChange={(next) => setValue((current) => ({ ...current, domain: next }))}
          placeholder="概率统计"
          required
        />
        <Field
          label="难度"
          type="number"
          min="1"
          max="5"
          value={String(value.difficulty)}
          onChange={(next) =>
            setValue((current) => ({
              ...current,
              difficulty: Number(next || 2),
            }))
          }
          required
        />
      </div>

      <div
        className={
          variant === "custom" && !customDetailsOpen
            ? "hidden"
            : "grid gap-3 md:grid-cols-2"
        }
      >
        <Field
          label="子领域"
          value={value.subdomain ?? ""}
          onChange={(next) =>
            setValue((current) => ({ ...current, subdomain: next || null }))
          }
          placeholder="条件概率"
        />
        <Field
          label="标签"
          value={value.tags.join("\n")}
          onChange={(next) =>
            setValue((current) => ({ ...current, tags: parseList(next) }))
          }
          placeholder="每行或逗号分隔"
        />
      </div>

      {variant === "custom" && customDetailsOpen ? (
        <Field
          label="下次提示"
          value={value.memoryHook ?? ""}
          onChange={(next) =>
            setValue((current) => ({ ...current, memoryHook: next }))
          }
          placeholder="可选：一句你下次卡住时想看到的提醒"
        />
      ) : null}

      <div
        className={
          variant === "custom" && hasGeneratedDraft
            ? "hidden"
            : "grid gap-3 md:grid-cols-2"
        }
      >
        <Field
          label="LaTeX 表达式"
          value={value.expressionLatex}
          onChange={(next) =>
            setValue((current) => ({ ...current, expressionLatex: next }))
          }
          required
        />
        <Field
          label="一句话用途"
          value={value.oneLineUse}
          onChange={(next) =>
            setValue((current) => ({ ...current, oneLineUse: next }))
          }
          required
        />
      </div>

      <div
        className={
          variant === "custom" && !customDetailsOpen
            ? "hidden"
            : "grid gap-3 md:grid-cols-2"
        }
      >
        <TextAreaField
          label="意义说明"
          value={value.meaning}
          onChange={(next) => setValue((current) => ({ ...current, meaning: next }))}
          className="min-h-24"
          required
        />
        <TextAreaField
          label="直觉解释"
          value={value.intuition ?? ""}
          onChange={(next) =>
            setValue((current) => ({ ...current, intuition: next || null }))
          }
          className="min-h-24"
        />
      </div>

      {customDetailsOpen || variant === "official" ? (
        <TextAreaField
          label="推导"
          value={value.derivation ?? ""}
          onChange={(next) =>
            setValue((current) => ({ ...current, derivation: next || null }))
          }
          className="min-h-24"
        />
      ) : null}

      <div
        className={
          variant === "custom" && !customDetailsOpen
            ? "hidden"
            : "grid gap-3 md:grid-cols-2 xl:grid-cols-4"
        }
      >
        <TextAreaField
          label="适用条件"
          value={value.useConditions.join("\n")}
          onChange={(next) =>
            setValue((current) => ({ ...current, useConditions: parseList(next) }))
          }
          className="min-h-28"
        />
        <TextAreaField
          label="不适用条件"
          value={value.nonUseConditions.join("\n")}
          onChange={(next) =>
            setValue((current) => ({
              ...current,
              nonUseConditions: parseList(next),
            }))
          }
          className="min-h-28"
        />
        <TextAreaField
          label="常见误用"
          value={value.antiPatterns.join("\n")}
          onChange={(next) =>
            setValue((current) => ({ ...current, antiPatterns: parseList(next) }))
          }
          className="min-h-28"
        />
        <TextAreaField
          label="典型题型"
          value={value.typicalProblems.join("\n")}
          onChange={(next) =>
            setValue((current) => ({
              ...current,
              typicalProblems: parseList(next),
            }))
          }
          className="min-h-28"
        />
      </div>

      {customDetailsOpen || variant === "official" ? (
        <>
          <TextAreaField
            label="例题"
            value={value.examples.join("\n")}
            onChange={(next) =>
              setValue((current) => ({ ...current, examples: parseList(next) }))
            }
            className="min-h-28"
          />

          <VariableEditor
            variables={value.variables}
            onChange={(variables) => setValue((current) => ({ ...current, variables }))}
          />
          <ReviewItemEditor
            items={value.reviewItems}
            onChange={(reviewItems) =>
              setValue((current) => ({ ...current, reviewItems }))
            }
          />

          <section className="grid gap-3 rounded-lg border bg-muted/10 p-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="grid gap-1">
                <h3 className="font-medium">图像配置</h3>
                <p className="text-sm leading-5 text-muted-foreground">
                  基于当前公式内容生成交互曲线配置；保存后会在公式详情页展示。
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={
                  isPending ||
                  isDraftPending ||
                  isPlotConfigPending ||
                  !value.title.trim() ||
                  !value.expressionLatex.trim() ||
                  !value.oneLineUse.trim()
                }
                onClick={generatePlotConfig}
              >
                {isPlotConfigPending ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Sparkles data-icon="inline-start" />
                )}
                {value.plotConfig ? "AI 重新配置图像" : "AI 配置图像"}
              </Button>
            </div>
            <JsonField
              key={stringifyJsonFieldValue(value.plotConfig ?? null)}
              label="图像配置 JSON"
              value={value.plotConfig ?? null}
              onChange={(plotConfig) =>
                setValue((current) => ({ ...current, plotConfig }))
              }
            />
          </section>
        </>
      ) : null}
      {variant === "official" ? (
        <>
          <RelationEditor
            currentSlug={value.slug}
            options={relationOptions}
            relations={value.relations}
            onChange={(relations) => setValue((current) => ({ ...current, relations }))}
          />

        </>
      ) : null}

      {variant === "official" || customDetailsOpen || error ? (
        validationIssues.length > 0 ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
          <p className="font-medium">保存前建议处理：</p>
          <ul className="mt-1 list-inside list-disc">
            {validationIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-900">
          内容结构检查通过。
        </p>
        )
      ) : null}

      {error ? (
        <p className="whitespace-pre-line rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="whitespace-pre-line rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <Save data-icon="inline-start" />
          )}
          {variant === "custom" && mode === "create" ? "创建并开始训练" : "保存"}
        </Button>
        {mode === "edit" && variant === "official" ? (
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={deleteFormula}
          >
            <Trash2 data-icon="inline-start" />
            删除
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(variant === "custom" ? "/formulas" : "/admin/formulas")
          }
        >
          {variant === "custom" ? "返回公式库" : "返回列表"}
        </Button>
      </div>
    </form>
  );

  function submitForm() {
    setError(null);
    setMessage(null);

    if (validationIssues.some((issue) => issue.includes("不存在"))) {
      setError(validationIssues.join("\n"));
      return;
    }

    startTransition(async () => {
      const endpoint =
        variant === "custom"
          ? mode === "create"
            ? "/api/formulas"
            : `/api/formulas/${encodeURIComponent(initialValue?.slug ?? value.slug)}`
          : mode === "create"
          ? "/api/admin/formulas"
          : `/api/admin/formulas/${encodeURIComponent(initialValue?.slug ?? value.slug)}`;
      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          variant === "custom"
            ? {
                ...value,
                variables: customDetailsOpen ? value.variables : [],
                reviewItems: value.reviewItems,
              }
            : value,
        ),
      });
      const result = (await response.json()) as {
        data?: { slug: string };
        error?: string;
      };

      if (!response.ok || !result.data) {
        setError(result.error ?? "保存失败");
        return;
      }

      setMessage(
        validationIssues.length > 0
          ? `已保存。仍有 ${validationIssues.length} 个内容建议待处理。`
          : "已保存，内容结构检查通过。",
      );
      router.refresh();

      if (variant === "custom") {
        router.push(`/formulas/${result.data.slug}?from=custom`);
      } else if (mode === "create" || result.data.slug !== initialValue?.slug) {
        router.push(`/admin/formulas/${result.data.slug}/edit`);
      }
    });
  }

  async function generateDraft() {
    const prompt = draftPrompt.trim();

    if (!prompt) {
      setError("请先输入要整理的公式或笔记。");
      return;
    }

    setError(null);
    setMessage(null);
    setIsDraftPending(true);

    try {
      const response = await fetch("/api/formulas/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
        }),
      });
      const payload = (await response.json()) as {
        data?: GeneratedFormulaDraft;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "AI 草稿生成失败");
      }

      fillWithDraft(payload.data);
      setCustomDetailsOpen(false);
      setMessage("已填充 AI 草稿，请检查变量、复习题和关系后再保存。");
    } catch (draftError) {
      setError(draftError instanceof Error ? draftError.message : "AI 草稿生成失败");
    } finally {
      setIsDraftPending(false);
    }
  }

  async function generatePlotConfig() {
    if (!value.title.trim() || !value.expressionLatex.trim() || !value.oneLineUse.trim()) {
      setError("请先填写标题、LaTeX 表达式和一句话用途。");
      return;
    }

    setError(null);
    setMessage(null);
    setIsPlotConfigPending(true);

    try {
      const response = await fetch("/api/formulas/plot-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: value.title,
          expressionLatex: value.expressionLatex,
          domain: value.domain,
          subdomain: value.subdomain,
          oneLineUse: value.oneLineUse,
          meaning: value.meaning,
          intuition: value.intuition,
          useConditions: value.useConditions,
          antiPatterns: value.antiPatterns,
          variables: value.variables,
        }),
      });
      const payload = (await response.json()) as {
        data?: FormulaPlotConfig;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "AI 图像配置生成失败");
      }

      setValue((current) => ({
        ...current,
        plotConfig: payload.data ?? null,
      }));
      setMessage("AI 已生成图像配置，请检查 JSON 后保存。");
    } catch (plotConfigError) {
      setError(
        plotConfigError instanceof Error
          ? plotConfigError.message
          : "AI 图像配置生成失败",
      );
    } finally {
      setIsPlotConfigPending(false);
    }
  }

  function fillWithDraft(draft: GeneratedFormulaDraft) {
    setValue((current) => ({
      ...current,
      slug: current.slug || slugify(draft.title),
      title: draft.title,
      expressionLatex: draft.expressionLatex,
      domain: draft.domain,
      subdomain: draft.subdomain || null,
      oneLineUse: draft.oneLineUse,
      meaning: draft.meaning,
      derivation: draft.derivation || current.derivation,
      difficulty: draft.difficulty,
      tags: normalizeUnique([
        variant === "custom" ? "custom" : "official",
        ...draft.tags,
      ]),
      useConditions: draft.useConditions,
      nonUseConditions: draft.nonUseConditions,
      antiPatterns: draft.antiPatterns,
      typicalProblems: draft.typicalProblems,
      examples: draft.examples,
      reviewItems: buildReviewItemsFromDraft(draft),
    }));
  }

  function deleteFormula() {
    if (
      !window.confirm(
        `确定删除官方公式「${value.title}」？相关训练记录会随级联关系一并清理。`,
      )
    ) {
      return;
    }

    setError(null);
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(
        `/api/admin/formulas/${encodeURIComponent(initialValue?.slug ?? value.slug)}`,
        {
          method: "DELETE",
        },
      );
      const result = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setError(result.error ?? "删除失败");
        return;
      }

      router.push("/admin/formulas");
      router.refresh();
    });
  }
}

function VariableEditor({
  variables,
  onChange,
}: {
  variables: FormulaVariableInput[];
  onChange: (variables: FormulaVariableInput[]) => void;
}) {
  return (
    <section className="grid gap-3 rounded-lg border bg-muted/10 p-3">
      <EditorHeader
        title="变量说明"
        actionLabel="添加变量"
        onAdd={() =>
          onChange([...variables, { symbol: "", name: "", description: "", unit: null }])
        }
      />
      <div className="grid gap-3">
        {variables.map((variable, index) => (
          <div key={index} className="grid gap-2 rounded-lg border bg-background p-3">
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
              <Input
                value={variable.symbol}
                onChange={(event) =>
                  onChange(updateAt(variables, index, { symbol: event.target.value }))
                }
                placeholder="符号"
              />
              <Input
                value={variable.name}
                onChange={(event) =>
                  onChange(updateAt(variables, index, { name: event.target.value }))
                }
                placeholder="名称"
              />
              <Input
                value={variable.unit ?? ""}
                onChange={(event) =>
                  onChange(updateAt(variables, index, { unit: event.target.value || null }))
                }
                placeholder="单位，可空"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onChange(removeAt(variables, index))}
              >
                删除
              </Button>
            </div>
            <Textarea
              value={variable.description}
              onChange={(event) =>
                onChange(updateAt(variables, index, { description: event.target.value }))
              }
              placeholder="变量含义"
              className="min-h-16"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewItemEditor({
  items,
  onChange,
}: {
  items: FormulaReviewItemInput[];
  onChange: (items: FormulaReviewItemInput[]) => void;
}) {
  return (
    <section className="grid gap-3 rounded-lg border bg-muted/10 p-3">
      <EditorHeader
        title="复习题"
        actionLabel="添加题目"
        onAdd={() =>
          onChange([
            ...items,
            {
              type: "recall",
              prompt: "",
              answer: "",
              explanation: "",
              difficulty: 2,
            },
          ])
        }
      />
      <div className="grid gap-3">
        {items.map((item, index) => (
          <div key={index} className="grid gap-2 rounded-lg border bg-background p-3">
            <div className="grid gap-2 md:grid-cols-[12rem_8rem_auto]">
              <Select
                value={item.type}
                onValueChange={(next) =>
                  onChange(
                    updateAt(items, index, {
                      type: (next ?? "recall") as FormulaReviewItemInput["type"],
                    }),
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recall">回忆题</SelectItem>
                  <SelectItem value="recognition">识别题</SelectItem>
                  <SelectItem value="application">应用题</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="1"
                max="5"
                value={String(item.difficulty)}
                onChange={(event) =>
                  onChange(
                    updateAt(items, index, {
                      difficulty: Number(event.target.value || 2),
                    }),
                  )
                }
                placeholder="难度"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onChange(removeAt(items, index))}
              >
                删除
              </Button>
            </div>
            <Textarea
              value={item.prompt}
              onChange={(event) =>
                onChange(updateAt(items, index, { prompt: event.target.value }))
              }
              placeholder="题目"
              className="min-h-16"
            />
            <Textarea
              value={item.answer}
              onChange={(event) =>
                onChange(updateAt(items, index, { answer: event.target.value }))
              }
              placeholder="答案"
              className="min-h-16"
            />
            <Textarea
              value={item.explanation ?? ""}
              onChange={(event) =>
                onChange(updateAt(items, index, { explanation: event.target.value }))
              }
              placeholder="解释"
              className="min-h-16"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function RelationEditor({
  currentSlug,
  options,
  relations,
  onChange,
}: {
  currentSlug: string;
  options: RelationOption[];
  relations: FormulaRelationInput[];
  onChange: (relations: FormulaRelationInput[]) => void;
}) {
  const selectableOptions = options.filter((option) => option.slug !== currentSlug);

  return (
    <section className="grid gap-3 rounded-lg border bg-muted/10 p-3">
      <EditorHeader
        title="公式关系"
        actionLabel="添加关系"
        onAdd={() =>
          onChange([
            ...relations,
            {
              toSlug: selectableOptions[0]?.slug ?? "",
              relationType: "related",
              note: "",
            },
          ])
        }
      />
      <div className="grid gap-3">
        {relations.map((relation, index) => (
          <div key={index} className="grid gap-2 rounded-lg border bg-background p-3">
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_12rem_auto]">
              <Select
                value={relation.toSlug}
                onValueChange={(next) =>
                  onChange(updateAt(relations, index, { toSlug: next ?? "" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectableOptions.map((option) => (
                    <SelectItem key={option.slug} value={option.slug}>
                      {option.title} / {option.slug}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={relation.relationType}
                onValueChange={(next) =>
                  onChange(
                    updateAt(relations, index, {
                      relationType: (next ?? "related") as FormulaRelationInput["relationType"],
                    }),
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prerequisite">前置</SelectItem>
                  <SelectItem value="related">相关</SelectItem>
                  <SelectItem value="confusable">易混</SelectItem>
                  <SelectItem value="application_of">应用于</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onChange(removeAt(relations, index))}
              >
                删除
              </Button>
            </div>
            <Textarea
              value={relation.note ?? ""}
              onChange={(event) =>
                onChange(updateAt(relations, index, { note: event.target.value }))
              }
              placeholder="关系说明"
              className="min-h-16"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function EditorHeader({
  title,
  actionLabel,
  onAdd,
}: {
  title: string;
  actionLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-medium">{title}</h3>
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus data-icon="inline-start" />
        {actionLabel}
      </Button>
    </div>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function PreviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border bg-muted/10 p-3">
      <h4 className="text-sm font-medium">{title}</h4>
      {items.length > 0 ? (
        <ul className="mt-2 grid gap-1 text-sm leading-5 text-muted-foreground">
          {items.slice(0, 4).map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">未生成</p>
      )}
    </div>
  );
}

function Field({
  containerClassName,
  label,
  onChange,
  ...props
}: Omit<ComponentProps<typeof Input>, "onChange"> & {
  containerClassName?: string;
  label: string;
  onChange: (value: string) => void;
}) {
  const inputId = label.replace(/\s+/g, "-");

  return (
    <div className={`grid gap-1.5 ${containerClassName ?? ""}`}>
      <Label htmlFor={inputId}>{label}</Label>
      <Input id={inputId} onChange={(event) => onChange(event.target.value)} {...props} />
    </div>
  );
}

function TextAreaField({
  containerClassName,
  label,
  onChange,
  ...props
}: Omit<ComponentProps<typeof Textarea>, "onChange"> & {
  containerClassName?: string;
  label: string;
  onChange: (value: string) => void;
}) {
  const inputId = label.replace(/\s+/g, "-");

  return (
    <div className={`grid gap-1.5 ${containerClassName ?? ""}`}>
      <Label htmlFor={inputId}>{label}</Label>
      <Textarea
        id={inputId}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
    </div>
  );
}

function JsonField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const [rawValue, setRawValue] = useState(JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-1.5">
      <Label htmlFor="plot-config">{label}</Label>
      <Textarea
        id="plot-config"
        value={rawValue}
        onChange={(event) => {
          const nextRawValue = event.target.value;
          setRawValue(nextRawValue);
          try {
            const nextValue = nextRawValue.trim() ? JSON.parse(nextRawValue) : null;
            setError(null);
            onChange(nextValue);
          } catch {
            setError("JSON 格式错误，修正后才会更新。");
          }
        }}
        placeholder="null"
        className="min-h-32 font-mono text-sm"
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function stringifyJsonFieldValue(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function createEmptyFormula(variant: "official" | "custom"): OfficialFormulaFormValue {
  return {
    slug: "",
    title: "",
    expressionLatex: "",
    domain: variant === "custom" ? "自定义公式" : "概率统计",
    subdomain: null,
    oneLineUse: "",
    meaning: "",
    intuition: null,
    derivation: null,
    useConditions: [],
    nonUseConditions: [],
    antiPatterns: [],
    typicalProblems: [],
    examples: [],
    plotConfig: null,
    difficulty: 2,
    tags: [variant === "custom" ? "custom" : "official"],
    memoryHook: "",
    variables: [],
    reviewItems: [],
    relations: [],
  };
}

function validateFormula(
  value: OfficialFormulaFormValue,
  relationSlugs: Set<string>,
  variant: "official" | "custom",
) {
  const issues: string[] = [];

  if (variant === "official" && !value.slug.trim()) issues.push("Slug 不能为空。");
  if (!value.title.trim()) issues.push("标题不能为空。");
  if (!value.expressionLatex.trim()) issues.push("LaTeX 表达式不能为空。");
  if (!value.oneLineUse.trim()) issues.push("一句话用途不能为空。");
  if (!value.meaning.trim()) issues.push("意义说明不能为空。");
  if (value.useConditions.length === 0) issues.push("至少填写 1 条适用条件。");
  if (value.antiPatterns.length === 0) issues.push("至少填写 1 条常见误用。");
  if (value.typicalProblems.length === 0) issues.push("至少填写 1 条典型题型。");
  if (value.variables.length === 0) {
    issues.push("至少添加 1 个变量说明。");
  }

  value.variables.forEach((variable, index) => {
    if (!variable.symbol.trim() || !variable.name.trim() || !variable.description.trim()) {
      issues.push(`第 ${index + 1} 个变量缺少符号、名称或说明。`);
    }
  });

  const reviewTypes = new Set(value.reviewItems.map((item) => item.type));
  if (!reviewTypes.has("recall")) issues.push("缺少回忆题。");
  if (!reviewTypes.has("recognition")) issues.push("缺少识别题。");
  if (!reviewTypes.has("application")) issues.push("缺少应用题。");

  value.reviewItems.forEach((item, index) => {
    if (!item.prompt.trim() || !item.answer.trim()) {
      issues.push(`第 ${index + 1} 道复习题缺少题目或答案。`);
    }
  });

  value.relations.forEach((relation, index) => {
    if (!relation.toSlug.trim()) {
      issues.push(`第 ${index + 1} 条关系缺少目标公式。`);
    } else if (!relationSlugs.has(relation.toSlug)) {
      issues.push(`第 ${index + 1} 条关系目标不存在：${relation.toSlug}`);
    }
  });

  return issues;
}

function buildReviewItemsFromDraft(draft: GeneratedFormulaDraft): FormulaReviewItemInput[] {
  return [
    {
      type: "recall",
      prompt: `写出「${draft.title}」的核心表达式。`,
      answer: draft.expressionLatex,
      explanation: draft.oneLineUse,
      difficulty: Math.max(1, draft.difficulty - 1),
    },
    {
      type: "recognition",
      prompt: `题目要求“${draft.oneLineUse}”时，应优先想到哪条公式？`,
      answer: draft.title,
      explanation: `这是 ${draft.title} 的典型触发场景。`,
      difficulty: draft.difficulty,
    },
    {
      type: "application",
      prompt: draft.examples[0] ?? `请根据「${draft.title}」设计一个代入小题。`,
      answer: `先确认适用条件，再代入 ${draft.title}。`,
      explanation: draft.meaning,
      difficulty: Math.min(5, draft.difficulty + 1),
    },
  ];
}

function reviewTypeLabel(type: FormulaReviewItemInput["type"]) {
  if (type === "recall") {
    return "回忆题";
  }

  if (type === "recognition") {
    return "识别题";
  }

  return "应用题";
}

function updateAt<T>(items: T[], index: number, patch: Partial<T>) {
  return items.map((item, itemIndex) =>
    itemIndex === index ? { ...item, ...patch } : item,
  );
}

function removeAt<T>(items: T[], index: number) {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

function parseList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeUnique(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\u4e00-\u9fa5]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
