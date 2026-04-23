import { DerivationTrainer } from "@/components/derivation/derivation-trainer";
import { PhaseShell } from "@/components/app/phase-shell";
import { getFormulaDetail, getFormulaSummaries } from "@/server/services/formula-service";

export const dynamic = "force-dynamic";

export default async function DerivationPage() {
  const summaries = await getFormulaSummaries();
  const details = (
    await Promise.all(summaries.map((formula) => getFormulaDetail(formula.slug)))
  ).filter((formula) => formula?.derivation) as NonNullable<
    Awaited<ReturnType<typeof getFormulaDetail>>
  >[];

  return (
    <PhaseShell
      activePath="/derivation"
      eyebrow="推导训练"
      title="会背之后，再练为什么成立。"
    >
      <DerivationTrainer formulas={details} />
    </PhaseShell>
  );
}
