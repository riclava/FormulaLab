import { notFound } from "next/navigation";

import { PhaseShell } from "@/components/app/phase-shell";
import {
  FormulaDetailView,
  type FocusSection,
} from "@/components/formula/formula-detail-view";
import { normalizeRouteParam } from "@/lib/route-params";
import { requireCurrentLearner } from "@/server/auth/current-learner";
import {
  getFormulaDetail,
  getFormulaMemoryHooks,
  getFormulaRelationDetails,
} from "@/server/services/formula-service";

function parseFocusSection(value?: string): FocusSection | undefined {
  if (
    value === "use" ||
    value === "non-use" ||
    value === "anti-patterns" ||
    value === "hooks" ||
    value === "relations" ||
    value === "examples" ||
    value === "derivation"
  ) {
    return value;
  }

  return undefined;
}

function parseEntryPoint(value?: string) {
  if (
    value === "review" ||
    value === "summary" ||
    value === "paths" ||
    value === "formulas" ||
    value === "derivation" ||
    value === "memory-hooks" ||
    value === "custom"
  ) {
    return value;
  }

  return "formulas" as const;
}

function buildReturnLink({
  entryPoint,
  mode,
  domain,
}: {
  entryPoint: ReturnType<typeof parseEntryPoint>;
  mode?: string;
  domain?: string;
}) {
  const domainQuery = domain ? `domain=${encodeURIComponent(domain)}` : "";

  switch (entryPoint) {
    case "review":
      return {
        href: withQuery(mode === "weak" ? "/review?mode=weak" : "/review", domainQuery),
        label: mode === "weak" ? "继续补弱" : "回到当前复习",
      };
    case "summary":
      return {
        href: withQuery("/summary", domainQuery),
        label: "回到进展",
      };
    case "paths":
      return {
        href: withQuery("/paths", domainQuery),
        label: "继续学习路径",
      };
    case "derivation":
      return {
        href: withQuery("/derivation", domainQuery),
        label: "回到推导训练",
      };
    case "memory-hooks":
      return {
        href: withQuery("/memory-hooks", domainQuery),
        label: "回到提示整理",
      };
    case "custom":
      return {
        href: "/formulas/new",
        label: "回到自定义公式",
      };
    case "formulas":
    default:
      return {
        href: withQuery("/formulas", domainQuery),
        label: "回到公式列表",
      };
  }
}

function withQuery(href: string, query: string) {
  if (!query) {
    return href;
  }

  return href.includes("?") ? `${href}&${query}` : `${href}?${query}`;
}

export default async function FormulaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ focus?: string; from?: string; mode?: string; domain?: string }>;
}) {
  const { id: rawId } = await params;
  const { focus, from, mode, domain } = await searchParams;
  const id = normalizeRouteParam(rawId);
  const current = await requireCurrentLearner();
  const [formula, relations, hooks] = await Promise.all([
    getFormulaDetail({
      idOrSlug: id,
      userId: current.learner.id,
    }),
    getFormulaRelationDetails(id, current.learner.id),
    getFormulaMemoryHooks({
      formulaIdOrSlug: id,
      userId: current.learner.id,
    }),
  ]);

  if (!formula) {
    notFound();
  }

  return (
    <PhaseShell
      activePath="/formulas"
      eyebrow="公式详情"
      title="查看公式详情"
    >
      <FormulaDetailView
        formulaIdOrSlug={id}
        initialFormula={formula}
        initialRelations={relations ?? []}
        initialHooks={hooks ?? formula.memoryHooks}
        focusSection={parseFocusSection(focus)}
        entryPoint={parseEntryPoint(from)}
        returnLink={buildReturnLink({
          entryPoint: parseEntryPoint(from),
          mode,
          domain,
        })}
      />
    </PhaseShell>
  );
}
