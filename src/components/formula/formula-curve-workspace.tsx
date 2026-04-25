"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Save, Sparkles, Trash2, X } from "lucide-react";

import { FormulaCurveViewer } from "@/components/formula/formula-curve-viewer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { FormulaDetail, FormulaPlotConfig } from "@/types/formula";

const defaultPlotConfig: FormulaPlotConfig = {
  type: "explicit",
  title: "公式曲线",
  description: "拖动参数观察曲线如何变化。",
  x: {
    min: -5,
    max: 5,
    label: "x",
  },
  y: {
    expression: "a * x^2 + b * x + c",
    label: "y",
  },
  parameters: [
    {
      name: "a",
      label: "a",
      defaultValue: 1,
      min: -5,
      max: 5,
      step: 0.1,
    },
    {
      name: "b",
      label: "b",
      defaultValue: 0,
      min: -10,
      max: 10,
      step: 0.1,
    },
    {
      name: "c",
      label: "c",
      defaultValue: 0,
      min: -10,
      max: 10,
      step: 0.1,
    },
  ],
  viewBox: {
    x: [-5, 5],
    y: [-10, 10],
  },
};

export function FormulaCurveWorkspace({
  formulaIdOrSlug,
  plotConfig,
  editable = true,
  onSaved,
}: {
  formulaIdOrSlug: string;
  plotConfig: FormulaPlotConfig | null;
  editable?: boolean;
  onSaved: (formula: FormulaDetail) => void;
}) {
  const [editorOpen, setEditorOpen] = useState(editable && !plotConfig);
  const [draft, setDraft] = useState(() => stringifyPlotConfig(plotConfig ?? defaultPlotConfig));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function generateWithAi() {
    setError(null);
    setMessage(null);
    setIsGenerating(true);

    try {
      const response = await fetch(`/api/formulas/${formulaIdOrSlug}/plot-config`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        data?: FormulaDetail;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "AI 曲线生成失败。");
      }

      setDraft(stringifyPlotConfig(payload.data.plotConfig ?? defaultPlotConfig));
      setEditorOpen(false);
      setMessage("AI 已生成曲线配置。");
      onSaved(payload.data);
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "AI 曲线生成失败。");
    } finally {
      setIsGenerating(false);
    }
  }

  function saveDraft() {
    setError(null);
    setMessage(null);

    let nextPlotConfig: unknown;

    try {
      nextPlotConfig = JSON.parse(draft);
    } catch {
      setError("JSON 格式不正确。");
      return;
    }

    startTransition(async () => {
      const formula = await patchPlotConfig(nextPlotConfig);

      if (!formula) {
        return;
      }

      setDraft(stringifyPlotConfig(formula.plotConfig ?? defaultPlotConfig));
      setEditorOpen(false);
      setMessage("曲线配置已保存。");
      onSaved(formula);
    });
  }

  function clearPlotConfig() {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const formula = await patchPlotConfig(null);

      if (!formula) {
        return;
      }

      setDraft(stringifyPlotConfig(defaultPlotConfig));
      setEditorOpen(true);
      setMessage("曲线配置已移除。");
      onSaved(formula);
    });
  }

  async function patchPlotConfig(nextPlotConfig: unknown) {
    const response = await fetch(`/api/formulas/${formulaIdOrSlug}/plot-config`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plotConfig: nextPlotConfig,
      }),
    });
    const payload = (await response.json()) as {
      data?: FormulaDetail;
      error?: string;
    };

    if (!response.ok || !payload.data) {
      setError(payload.error ?? "曲线配置保存失败。");
      return null;
    }

    return payload.data;
  }

  return (
    <div className="grid gap-4">
      {plotConfig ? <FormulaCurveViewer config={plotConfig} /> : null}

      {editable ? (
        <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          disabled={isPending || isGenerating}
          onClick={generateWithAi}
        >
          {isGenerating ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <Sparkles data-icon="inline-start" />
          )}
          {plotConfig ? "AI 重新生成" : "AI 生成曲线"}
        </Button>
        <Button
          type="button"
          variant={editorOpen ? "secondary" : "outline"}
          disabled={isGenerating}
          onClick={() => {
            setDraft(stringifyPlotConfig(plotConfig ?? defaultPlotConfig));
            setEditorOpen((current) => !current);
            setError(null);
            setMessage(null);
          }}
        >
          {editorOpen ? <X data-icon="inline-start" /> : <Pencil data-icon="inline-start" />}
          {editorOpen ? "收起配置" : plotConfig ? "编辑配置" : "补充曲线"}
        </Button>
        {plotConfig ? (
          <Button
            type="button"
            variant="destructive"
            disabled={isPending || isGenerating}
            onClick={clearPlotConfig}
          >
            <Trash2 data-icon="inline-start" />
            移除曲线
          </Button>
        ) : null}
        </div>
      ) : null}

      {!editable && !plotConfig ? (
        <p className="rounded-lg border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          官方公式暂未提供曲线配置。
        </p>
      ) : null}

      {editable && editorOpen ? (
        <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-80 font-mono text-xs leading-5"
            spellCheck={false}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" disabled={isPending} onClick={saveDraft}>
              <Save data-icon="inline-start" />
              保存曲线
            </Button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function stringifyPlotConfig(plotConfig: FormulaPlotConfig) {
  return JSON.stringify(plotConfig, null, 2);
}
