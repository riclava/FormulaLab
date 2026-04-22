import { notFound } from "next/navigation";

import { PhaseShell } from "@/components/app/phase-shell";
import { ContentAssistEditor } from "@/components/content-assist/content-assist-editor";
import { getContentAssistDraft } from "@/server/services/content-assist-service";

export const dynamic = "force-dynamic";

export default async function ContentAssistDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const payload = await getContentAssistDraft({
    formulaIdOrSlug: slug,
  });

  if (!payload) {
    notFound();
  }

  return (
    <PhaseShell
      activePath=""
      eyebrow="Phase 8 / Draft Review"
      title="先把草稿做对，再决定要不要放进正式内容。"
      description="这里的每一段解释、题目、关联和联想候选都可以编辑。只有审核通过后，seed 才会吸收它们。"
    >
      <ContentAssistEditor
        formula={payload.formula}
        initialDraft={payload.draft}
      />
    </PhaseShell>
  );
}
