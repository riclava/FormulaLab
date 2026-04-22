import { NextResponse } from "next/server";

import { updateContentAssistDraft } from "@/server/services/content-assist-service";
import type { ContentAssistDraft } from "@/types/content-assist";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const payload = (await request.json()) as ContentAssistDraft;

  const draft = await updateContentAssistDraft({
    formulaSlug: slug,
    input: payload,
  });

  if (!draft) {
    return NextResponse.json(
      {
        error: "Draft formula not found",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: draft,
  });
}
