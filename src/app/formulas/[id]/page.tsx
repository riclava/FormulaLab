import { notFound } from "next/navigation";

import { PhaseShell } from "@/components/app/phase-shell";
import {
  FormulaDetailView,
  type FocusSection,
} from "@/components/formula/formula-detail-view";
import { getCurrentLearner } from "@/server/auth/current-learner";
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
}: {
  entryPoint: ReturnType<typeof parseEntryPoint>;
  mode?: string;
}) {
  switch (entryPoint) {
    case "review":
      return {
        href: mode === "weak" ? "/review?mode=weak" : "/review",
        label: mode === "weak" ? "回到弱项重练" : "回到今日复习",
      };
    case "summary":
      return {
        href: "/summary",
        label: "回到复习总结",
      };
    case "paths":
      return {
        href: "/paths",
        label: "回到学习路径",
      };
    case "derivation":
      return {
        href: "/derivation",
        label: "回到推导训练",
      };
    case "memory-hooks":
      return {
        href: "/memory-hooks",
        label: "回到记忆钩子",
      };
    case "custom":
      return {
        href: "/formulas/new",
        label: "回到自定义公式",
      };
    case "formulas":
    default:
      return {
        href: "/formulas",
        label: "回到公式列表",
      };
  }
}

export default async function FormulaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ focus?: string; from?: string; mode?: string }>;
}) {
  const { id } = await params;
  const { focus, from, mode } = await searchParams;
  const current = await getCurrentLearner();
  const [formula, relations, hooks] = await Promise.all([
    getFormulaDetail(id),
    getFormulaRelationDetails(id),
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
      title="先确认边界，再决定回到哪条训练链路。"
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
        })}
        selectableHooks
      />
    </PhaseShell>
  );
}
