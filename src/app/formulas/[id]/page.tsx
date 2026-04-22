import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { PhaseShell } from "@/components/app/phase-shell";
import {
  FormulaDetailView,
  type FocusSection,
} from "@/components/formula/formula-detail-view";
import {
  ANONYMOUS_SESSION_COOKIE,
  getOrCreateAnonymousUser,
} from "@/server/services/anonymous-user-service";
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

export default async function FormulaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ focus?: string }>;
}) {
  const { id } = await params;
  const { focus } = await searchParams;
  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get(ANONYMOUS_SESSION_COOKIE)?.value;
  const anonymousUser = existingSessionId
    ? await getOrCreateAnonymousUser(existingSessionId)
    : null;
  const [formula, relations, hooks] = await Promise.all([
    getFormulaDetail(id),
    getFormulaRelationDetails(id),
    getFormulaMemoryHooks({
      formulaIdOrSlug: id,
      userId: anonymousUser?.user.id,
    }),
  ]);

  if (!formula) {
    notFound();
  }

  return (
    <PhaseShell
      activePath="/formulas"
      eyebrow="Phase 4 / 错误补弱"
      title="公式详情不是百科页，而是帮助你更快判断和使用。"
      description="这里会优先展示什么时候该用、什么时候别用、常见误用、记忆联想和关联公式，让你在补弱时直接抓住会错的原因。"
    >
      <FormulaDetailView
        formulaIdOrSlug={id}
        initialFormula={formula}
        initialRelations={relations ?? []}
        initialHooks={hooks ?? formula.memoryHooks}
        focusSection={parseFocusSection(focus)}
        selectableHooks
      />
    </PhaseShell>
  );
}
