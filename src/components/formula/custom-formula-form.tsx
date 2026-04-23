"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { useRef, useState, useTransition } from "react";
import { ArrowRight, Loader2, Plus, Sparkles, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CreatedFormula = {
  slug: string;
};

type FormulaDraft = {
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
  memoryHook: string;
};

export function CustomFormulaForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [isDraftPending, setIsDraftPending] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      className="grid gap-5 rounded-lg border bg-background p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);

        setError(null);
        startTransition(async () => {
          const response = await fetch("/api/formulas", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: stringValue(formData, "title"),
              expressionLatex: stringValue(formData, "expressionLatex"),
              domain: stringValue(formData, "domain"),
              subdomain: stringValue(formData, "subdomain"),
              oneLineUse: stringValue(formData, "oneLineUse"),
              meaning: stringValue(formData, "meaning"),
              derivation: stringValue(formData, "derivation"),
              difficulty: Number(stringValue(formData, "difficulty") || 2),
              tags: listValue(formData, "tags"),
              useConditions: listValue(formData, "useConditions"),
              nonUseConditions: listValue(formData, "nonUseConditions"),
              antiPatterns: listValue(formData, "antiPatterns"),
              typicalProblems: listValue(formData, "typicalProblems"),
              examples: listValue(formData, "examples"),
              memoryHook: stringValue(formData, "memoryHook"),
            }),
          });
          const payload = (await response.json()) as {
            data?: CreatedFormula;
            error?: string;
          };

          if (!response.ok || !payload.data) {
            setError(payload.error ?? "创建公式失败");
            return;
          }

          setCreatedSlug(payload.data.slug);
          router.refresh();
        });
      }}
    >
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold">新建公式</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          单条创建适合先把一条公式纳入训练；批量导入适合从笔记或表格整理好的 JSON。
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border bg-muted/20 p-4">
        <div className="grid gap-1">
          <Label htmlFor="formula-draft-prompt">AI 填充草稿</Label>
          <p className="text-sm leading-6 text-muted-foreground">
            输入公式名、题面、课堂笔记或一段说明，AI 会整理成下面的字段，保存前仍可人工修改。
          </p>
        </div>
        <Textarea
          id="formula-draft-prompt"
          value={draftPrompt}
          onChange={(event) => setDraftPrompt(event.target.value)}
          placeholder="例如：二项分布，n 次独立伯努利试验中成功 k 次的概率，想补充适用条件和常见误用。"
          className="min-h-28"
        />
        {draftMessage ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-sm text-emerald-900">
            {draftMessage}
          </p>
        ) : null}
        <div>
          <Button
            type="button"
            variant="secondary"
            disabled={isPending || isDraftPending || !draftPrompt.trim()}
            onClick={generateFormulaDraft}
          >
            {isDraftPending ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Sparkles data-icon="inline-start" />
            )}
            用 AI 填充
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="公式标题" name="title" placeholder="例如：泊松分布概率质量函数" required />
        <Field label="知识域" name="domain" placeholder="例如：概率统计" defaultValue="自定义公式" />
        <Field label="子领域" name="subdomain" placeholder="例如：随机变量" />
        <Field label="难度" name="difficulty" type="number" min="1" max="5" defaultValue="2" />
      </div>

      <Field
        label="LaTeX 表达式"
        name="expressionLatex"
        placeholder="P(X=k)=\\frac{\\lambda^k e^{-\\lambda}}{k!}"
        required
      />
      <Field
        label="一句话用途"
        name="oneLineUse"
        placeholder="描述什么时候想到这条公式"
        required
      />

      <TextAreaField label="公式含义" name="meaning" placeholder="用自己的话解释这条公式在算什么。" />
      <TextAreaField label="推导过程" name="derivation" placeholder="可选：写下关键推导步骤。" />

      <div className="grid gap-4 md:grid-cols-2">
        <TextAreaField label="什么时候用" name="useConditions" placeholder="每行一条" />
        <TextAreaField label="什么时候不能用" name="nonUseConditions" placeholder="每行一条" />
        <TextAreaField label="常见误用" name="antiPatterns" placeholder="每行一条" />
        <TextAreaField label="典型题型" name="typicalProblems" placeholder="每行一条" />
      </div>

      <TextAreaField label="例题" name="examples" placeholder="每行一题，第一题会用于 Application 训练。" />
      <Field label="标签" name="tags" placeholder="逗号或换行分隔，例如 custom, distribution" />
      <Field label="个人记忆钩子" name="memoryHook" placeholder="可选：一句你自己最容易记住的联想" />

      {error ? <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      {createdSlug ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
          <span>已创建。</span>
          <Button
            type="button"
            size="sm"
            onClick={() => router.push(`/formulas/${createdSlug}?from=custom`)}
          >
            查看详情
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Plus data-icon="inline-start" />}
          创建公式
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/review")}>
          去今日复习
        </Button>
      </div>

      <details className="rounded-lg border bg-muted/20 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          批量导入 JSON
        </summary>
        <div className="mt-4 grid gap-4">
          <p className="text-sm leading-6 text-muted-foreground">
            支持单个对象或数组。至少需要 title、expressionLatex、oneLineUse；其余字段可选。
          </p>
          <Textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder={`[
  {
    "title": "泊松分布概率质量函数",
    "expressionLatex": "P(X=k)=\\\\frac{\\\\lambda^k e^{-\\\\lambda}}{k!}",
    "domain": "概率统计",
    "oneLineUse": "单位区间内稀有事件次数的概率。",
    "memoryHook": "看到固定时间内发生几次，先想泊松。"
  }
]`}
            className="min-h-56 font-mono text-sm"
          />
          {importMessage ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-sm text-emerald-900">
              {importMessage}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={isPending || !importText.trim()}
              onClick={() => importFormulas(importText)}
            >
              {isPending ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Upload data-icon="inline-start" />
              )}
              导入公式
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setImportText("");
                setImportMessage(null);
              }}
            >
              清空
            </Button>
          </div>
        </div>
      </details>
    </form>
  );

  async function generateFormulaDraft() {
    const prompt = draftPrompt.trim();

    if (!prompt) {
      setError("请先输入要整理的公式或笔记。");
      return;
    }

    setError(null);
    setDraftMessage(null);
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
        data?: FormulaDraft;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "AI 草稿生成失败");
      }

      fillFormWithDraft(payload.data);
      setDraftMessage("已填充草稿，请检查后再创建公式。");
    } catch (draftError) {
      setError(draftError instanceof Error ? draftError.message : "AI 草稿生成失败");
    } finally {
      setIsDraftPending(false);
    }
  }

  function fillFormWithDraft(draft: FormulaDraft) {
    setFormValue("title", draft.title);
    setFormValue("expressionLatex", draft.expressionLatex);
    setFormValue("domain", draft.domain);
    setFormValue("subdomain", draft.subdomain);
    setFormValue("oneLineUse", draft.oneLineUse);
    setFormValue("meaning", draft.meaning);
    setFormValue("derivation", draft.derivation);
    setFormValue("difficulty", String(draft.difficulty));
    setFormValue("tags", draft.tags.join("\n"));
    setFormValue("useConditions", draft.useConditions.join("\n"));
    setFormValue("nonUseConditions", draft.nonUseConditions.join("\n"));
    setFormValue("antiPatterns", draft.antiPatterns.join("\n"));
    setFormValue("typicalProblems", draft.typicalProblems.join("\n"));
    setFormValue("examples", draft.examples.join("\n"));
    setFormValue("memoryHook", draft.memoryHook);
  }

  function setFormValue(name: string, value: string) {
    const field = formRef.current?.elements.namedItem(name);

    if (
      field instanceof HTMLInputElement ||
      field instanceof HTMLTextAreaElement
    ) {
      field.value = value;
    }
  }

  function importFormulas(rawText: string) {
    setError(null);
    setImportMessage(null);

    let formulas: unknown[];
    try {
      const parsed = JSON.parse(rawText) as unknown;
      formulas = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      setError("JSON 解析失败，请检查格式。");
      return;
    }

    if (formulas.length === 0) {
      setError("导入内容不能为空。");
      return;
    }

    startTransition(async () => {
      try {
        let importedCount = 0;
        for (const formula of formulas) {
          const response = await fetch("/api/formulas", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(normalizeImportedFormula(formula)),
          });
          const payload = (await response.json()) as {
            data?: CreatedFormula;
            error?: string;
          };

          if (!response.ok || !payload.data) {
            throw new Error(payload.error ?? "导入公式失败");
          }

          importedCount += 1;
          setCreatedSlug(payload.data.slug);
        }

        setImportMessage(`已导入 ${importedCount} 条公式。`);
        setImportText("");
        router.refresh();
      } catch (importError) {
        setError(
          importError instanceof Error ? importError.message : "导入公式失败",
        );
      }
    });
  }
}

function normalizeImportedFormula(value: unknown) {
  if (!value || typeof value !== "object") {
    throw new Error("每条公式必须是一个对象。");
  }

  const record = value as Record<string, unknown>;
  return {
    title: importedString(record.title),
    expressionLatex: importedString(record.expressionLatex),
    domain: importedString(record.domain),
    subdomain: importedString(record.subdomain),
    oneLineUse: importedString(record.oneLineUse),
    meaning: importedString(record.meaning),
    derivation: importedString(record.derivation),
    difficulty: Number(importedString(record.difficulty) || 2),
    tags: importedList(record.tags),
    useConditions: importedList(record.useConditions),
    nonUseConditions: importedList(record.nonUseConditions),
    antiPatterns: importedList(record.antiPatterns),
    typicalProblems: importedList(record.typicalProblems),
    examples: importedList(record.examples),
    memoryHook: importedString(record.memoryHook),
  };
}

function importedString(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function importedList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => importedString(item)).filter(Boolean);
  }

  return importedString(value)
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function Field({
  label,
  name,
  ...props
}: ComponentProps<typeof Input> & {
  label: string;
  name: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}

function TextAreaField({
  label,
  name,
  ...props
}: ComponentProps<typeof Textarea> & {
  label: string;
  name: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} {...props} />
    </div>
  );
}

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function listValue(formData: FormData, key: string) {
  return stringValue(formData, key)
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
