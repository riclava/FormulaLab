"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChartSpline,
  Lightbulb,
  Loader2,
  Network,
} from "lucide-react";

import { FormulaCurveWorkspace } from "@/components/formula/formula-curve-workspace";
import { LatexRenderer } from "@/components/formula/latex-renderer";
import { FormulaMemoryHookPanel } from "@/components/memory-hooks/formula-memory-hook-panel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FormulaDetail, FormulaRelationDetail } from "@/types/formula";

type FocusSection =
  | "use"
  | "non-use"
  | "anti-patterns"
  | "hooks"
  | "relations"
  | "examples"
  | "derivation"
  | "curve";

export type { FocusSection };

type DetailCategory = "core" | "concept" | "visual" | "practice" | "network" | "hooks";

export function FormulaDetailView({
  formulaIdOrSlug,
  initialFormula,
  initialRelations,
  initialHooks,
  focusSection,
  entryPoint = "formulas",
  returnLink,
  footer,
  compact = false,
}: {
  formulaIdOrSlug: string;
  initialFormula?: FormulaDetail;
  initialRelations?: FormulaRelationDetail[];
  initialHooks?: FormulaDetail["memoryHooks"];
  focusSection?: FocusSection;
  entryPoint?:
    | "review"
    | "summary"
    | "paths"
    | "formulas"
    | "derivation"
    | "memory-hooks"
    | "custom";
  returnLink?: {
    href: string;
    label: string;
  };
  footer?: React.ReactNode;
  compact?: boolean;
}) {
  const [formula, setFormula] = useState<FormulaDetail | null>(initialFormula ?? null);
  const [relations, setRelations] = useState<FormulaRelationDetail[]>(
    initialRelations ?? [],
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<DetailCategory>(
    categoryForFocus(focusSection) ?? defaultCategoryByEntryPoint(entryPoint),
  );

  useEffect(() => {
    let ignore = false;

    async function loadBundle() {
      try {
        const [formulaResponse, relationsResponse] = await Promise.all([
          fetch(`/api/formulas/${formulaIdOrSlug}`),
          fetch(`/api/formulas/${formulaIdOrSlug}/relations`),
        ]);
        const [formulaPayload, relationsPayload] = await Promise.all([
          formulaResponse.json() as Promise<{ data?: FormulaDetail; error?: string }>,
          relationsResponse.json() as Promise<{ data?: FormulaRelationDetail[]; error?: string }>,
        ]);

        if (!formulaResponse.ok || !formulaPayload.data) {
          throw new Error(formulaPayload.error ?? "公式详情加载失败");
        }

        if (!ignore) {
          setFormula(formulaPayload.data);
          setRelations(relationsResponse.ok && relationsPayload.data ? relationsPayload.data : []);
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
      {returnLink ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-3 text-sm">
          <div className="min-w-0">
            <p className="font-medium">{entryPointLabel(entryPoint)}</p>
          </div>
          <Link
            href={returnLink.href}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {returnLink.label}
          </Link>
        </div>
      ) : null}

      <section className="rounded-lg border bg-background p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={formula.ownership === "personal" ? "secondary" : "outline"}>
                {formula.ownership === "personal" ? "我的公式" : "官方"}
              </Badge>
              <Badge>{formula.domain}</Badge>
              {formula.subdomain ? <Badge variant="secondary">{formula.subdomain}</Badge> : null}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <h2 className={cn("font-semibold tracking-tight", compact ? "text-2xl" : "text-3xl")}>
                {formula.title}
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {formula.oneLineUse}
              </p>
            </div>
          </div>

          <div className="min-w-0 rounded-lg border bg-muted/20 p-4">
            <LatexRenderer block expression={formula.expressionLatex} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-background shadow-sm">
        <div className="border-b px-3 py-3">
          <div
            role="tablist"
            aria-label="公式详情内容"
            className="flex gap-2 overflow-x-auto pb-1"
          >
            {detailCategories.map((category) => {
              const Icon = category.icon;
              const selected = activeCategory === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`formula-category-${category.id}`}
                  id={`formula-category-trigger-${category.id}`}
                  className={cn(
                    "flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
                    selected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <Icon data-icon="inline-start" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          id={`formula-category-${activeCategory}`}
          role="tabpanel"
          aria-labelledby={`formula-category-trigger-${activeCategory}`}
          className="p-4 md:p-5"
        >
          {renderActiveCategory({
            activeCategory,
            formula,
            onFormulaSaved: setFormula,
            initialHooks,
            relations,
            focusSection,
          })}
        </div>
      </section>

      {footer ? <div className="rounded-lg border bg-background p-4 shadow-sm">{footer}</div> : null}
    </article>
  );
}

const quickActionsByEntryPoint: Record<
  NonNullable<Parameters<typeof FormulaDetailView>[0]["entryPoint"]>,
  Array<{
    section: FocusSection;
    label: string;
  }>
> = {
  review: [
    { section: "anti-patterns", label: "先看常见误用" },
    { section: "use", label: "确认适用条件" },
    { section: "hooks", label: "补一句自己的提醒" },
    { section: "relations", label: "看关联公式" },
  ],
  summary: [
    { section: "anti-patterns", label: "先补最弱点" },
    { section: "use", label: "确认适用条件" },
    { section: "hooks", label: "恢复记忆线索" },
    { section: "examples", label: "回看例题" },
    { section: "curve", label: "看曲线变化" },
  ],
  paths: [
    { section: "use", label: "先看什么时候用" },
    { section: "derivation", label: "再看推导过程" },
    { section: "relations", label: "接着看关联公式" },
    { section: "curve", label: "看曲线变化" },
    { section: "examples", label: "回到例题" },
  ],
  derivation: [
    { section: "derivation", label: "继续推导过程" },
    { section: "use", label: "确认适用条件" },
    { section: "relations", label: "看前后关联" },
    { section: "hooks", label: "补一句自己的提醒" },
  ],
  "memory-hooks": [
    { section: "hooks", label: "整理这条公式的提示" },
    { section: "anti-patterns", label: "把误用变提醒" },
    { section: "examples", label: "绑定题面画面" },
    { section: "use", label: "再看适用条件" },
  ],
  custom: [
    { section: "use", label: "确认适用条件" },
    { section: "examples", label: "看例题" },
    { section: "hooks", label: "先留一句提醒" },
    { section: "derivation", label: "补推导" },
  ],
  formulas: [
    { section: "use", label: "看适用条件" },
    { section: "anti-patterns", label: "看常见误用" },
    { section: "hooks", label: "写一句自己的提醒" },
    { section: "relations", label: "看关联公式" },
    { section: "curve", label: "看曲线变化" },
  ],
};

function entryPointLabel(
  entryPoint: NonNullable<Parameters<typeof FormulaDetailView>[0]["entryPoint"]>,
) {
  switch (entryPoint) {
    case "review":
      return "看完后回到当前复习";
    case "summary":
      return "正在修复总结里的薄弱项";
    case "paths":
      return "正在按学习路径推进";
    case "derivation":
      return "你正在做推导强化";
    case "memory-hooks":
      return "你正在集中整理本轮提示";
    case "custom":
      return "这是你自己加入训练的公式";
    case "formulas":
    default:
      return "你正在查看公式详情";
  }
}

const detailCategories: Array<{
  id: DetailCategory;
  label: string;
  icon: typeof BookOpen;
}> = [
  { id: "core", label: "核心判断", icon: CheckCircle2 },
  { id: "concept", label: "理解公式", icon: BookOpen },
  { id: "visual", label: "曲线理解", icon: ChartSpline },
  { id: "practice", label: "题目练习", icon: AlertTriangle },
  { id: "network", label: "关联网络", icon: Network },
  { id: "hooks", label: "个人提示", icon: Lightbulb },
];

function defaultCategoryByEntryPoint(
  entryPoint: NonNullable<Parameters<typeof FormulaDetailView>[0]["entryPoint"]>,
): DetailCategory {
  return categoryForFocus(quickActionsByEntryPoint[entryPoint]?.[0]?.section) ?? "core";
}

function categoryForFocus(focusSection?: FocusSection): DetailCategory | undefined {
  switch (focusSection) {
    case "use":
    case "non-use":
    case "anti-patterns":
      return "core";
    case "examples":
    case "derivation":
      return "practice";
    case "curve":
      return "visual";
    case "relations":
      return "network";
    case "hooks":
      return "hooks";
    default:
      return undefined;
  }
}

function renderActiveCategory({
  activeCategory,
  formula,
  onFormulaSaved,
  initialHooks,
  relations,
  focusSection,
}: {
  activeCategory: DetailCategory;
  formula: FormulaDetail;
  onFormulaSaved: (formula: FormulaDetail) => void;
  initialHooks?: FormulaDetail["memoryHooks"];
  relations: FormulaRelationDetail[];
  focusSection?: FocusSection;
}) {
  switch (activeCategory) {
    case "core":
      return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <DetailSection
            focused={focusSection === "use"}
            icon={CheckCircle2}
            title="什么时候用"
          >
            <BulletList items={formula.useConditions} tone="positive" />
          </DetailSection>

          <DetailSection
            focused={focusSection === "non-use"}
            icon={AlertTriangle}
            title="什么时候不能用"
          >
            <BulletList items={formula.nonUseConditions} tone="warning" />
          </DetailSection>

          <DetailSection
            focused={focusSection === "anti-patterns"}
            icon={AlertTriangle}
            title="常见误用"
            className="lg:col-span-2"
          >
            <BulletList items={formula.antiPatterns} tone="warning" />
          </DetailSection>
        </div>
      );
    case "concept":
      return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <DetailSection icon={BookOpen} title="公式含义">
            <p className="text-sm leading-6 text-muted-foreground">{formula.meaning}</p>
            {formula.intuition ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {formula.intuition}
              </p>
            ) : null}
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
        </div>
      );
    case "visual":
      return (
        <DetailSection focused={focusSection === "curve"} icon={ChartSpline} title="曲线理解">
          <FormulaCurveWorkspace
            key={formula.id}
            formulaIdOrSlug={formula.slug}
            plotConfig={formula.plotConfig}
            editable={formula.ownership === "personal"}
            onSaved={onFormulaSaved}
          />
        </DetailSection>
      );
    case "practice":
      return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <DetailSection icon={BookOpen} title="典型题型">
            <BulletList items={formula.typicalProblems} tone="neutral" />
          </DetailSection>

          <DetailSection focused={focusSection === "examples"} icon={BookOpen} title="例题">
            <BulletList items={formula.examples} tone="neutral" />
          </DetailSection>

          <DetailSection
            focused={focusSection === "derivation"}
            icon={BookOpen}
            title="推导过程"
            className="lg:col-span-2"
          >
            <p className="text-sm leading-6 text-muted-foreground">
              {formula.derivation ?? "当前还没有补充推导过程。"}
            </p>
          </DetailSection>
        </div>
      );
    case "network":
      return (
        <DetailSection focused={focusSection === "relations"} icon={Network} title="关联公式">
          <div className="grid gap-3 md:grid-cols-2">
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
      );
    case "hooks":
      return (
        <DetailSection focused={focusSection === "hooks"} icon={Lightbulb} title="下次提示">
          <FormulaMemoryHookPanel
            key={formula.id}
            formulaIdOrSlug={formula.slug}
            initialHooks={initialHooks ?? formula.memoryHooks}
          />
        </DetailSection>
      );
  }
}

const DetailSection = ({
  icon: Icon,
  title,
  children,
  focused,
  className,
}: {
  icon: typeof BookOpen;
  title: string;
  children: React.ReactNode;
  focused?: boolean;
  className?: string;
}) => (
  <section
    className={cn(
      "rounded-lg border bg-background p-4 transition-shadow md:p-5",
      focused && "ring-2 ring-primary/30 shadow-md",
      className,
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
