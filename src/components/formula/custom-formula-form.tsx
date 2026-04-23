"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { useState, useTransition } from "react";
import { ArrowRight, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CreatedFormula = {
  slug: string;
};

export function CustomFormulaForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
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
    </form>
  );
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
