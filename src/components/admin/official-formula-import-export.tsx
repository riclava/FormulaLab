"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Download, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function OfficialFormulaImportExport() {
  const router = useRouter();
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <details className="rounded-lg border bg-background p-4 shadow-sm">
      <summary className="cursor-pointer text-sm font-medium">
        导入 / 导出官方公式 JSON
      </summary>
      <div className="mt-4 grid gap-3">
        <p className="text-sm leading-6 text-muted-foreground">
          导出会下载当前官方公式库快照；导入支持导出文件原格式或公式数组，默认先校验，再确认写入。
        </p>
        <Textarea
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          placeholder="粘贴导出的 JSON，或直接粘贴 formulas 数组。"
          className="min-h-36 font-mono text-sm"
        />
        {message ? (
          <p className="whitespace-pre-line rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-900">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="whitespace-pre-line rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={exportLibrary}>
            <Download data-icon="inline-start" />
            导出 JSON
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isPending || !importText.trim()}
            onClick={() => importLibrary(true)}
          >
            {isPending ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Upload data-icon="inline-start" />
            )}
            校验导入
          </Button>
          <Button
            type="button"
            disabled={isPending || !importText.trim()}
            onClick={() => importLibrary(false)}
          >
            写入导入
          </Button>
        </div>
      </div>
    </details>
  );

  async function exportLibrary() {
    setError(null);
    setMessage(null);
    const response = await fetch("/api/admin/formulas/export");

    if (!response.ok) {
      setError("导出失败。");
      return;
    }

    const payload = (await response.json()) as unknown;
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `formulalab-official-formulas-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("已生成导出文件。");
  }

  function importLibrary(dryRun: boolean) {
    setError(null);
    setMessage(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(importText) as unknown;
    } catch {
      setError("JSON 解析失败，请检查格式。");
      return;
    }

    const formulas = normalizeImportedFormulas(parsed);

    if (formulas.length === 0) {
      setError("没有可导入的公式。");
      return;
    }

    if (!dryRun && !window.confirm(`确定写入 ${formulas.length} 条官方公式？同 slug 公式会被覆盖。`)) {
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/admin/formulas/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formulas,
          dryRun,
        }),
      });
      const payload = (await response.json()) as {
        data?: {
          ok: boolean;
          errors: string[];
          upsertCount: number;
          createCount: number;
          updateCount: number;
          createSlugs: string[];
          updateSlugs: string[];
        };
        error?: string;
      };

      if (!response.ok || !payload.data?.ok) {
        setError(payload.data?.errors.join("\n") || payload.error || "导入失败。");
        return;
      }

      setMessage(
        dryRun
          ? [
              `校验通过：可写入 ${payload.data.upsertCount} 条公式。`,
              `新增 ${payload.data.createCount} 条，覆盖 ${payload.data.updateCount} 条。`,
              formatSlugList("新增", payload.data.createSlugs),
              formatSlugList("覆盖", payload.data.updateSlugs),
            ]
              .filter(Boolean)
              .join("\n")
          : [
              `已写入 ${payload.data.upsertCount} 条公式。`,
              `新增 ${payload.data.createCount} 条，覆盖 ${payload.data.updateCount} 条。`,
              formatSlugList("新增", payload.data.createSlugs),
              formatSlugList("覆盖", payload.data.updateSlugs),
            ]
              .filter(Boolean)
              .join("\n"),
      );

      if (!dryRun) {
        setImportText("");
        router.refresh();
      }
    });
  }
}

function normalizeImportedFormulas(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as { formulas?: unknown }).formulas)
  ) {
    return (value as { formulas: unknown[] }).formulas;
  }

  return [];
}

function formatSlugList(label: string, slugs: string[]) {
  return slugs.length > 0 ? `${label}: ${slugs.join(", ")}` : "";
}
