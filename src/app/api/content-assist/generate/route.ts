import { NextResponse } from "next/server";

import { regenerateContentAssistDraft } from "@/server/services/content-assist-service";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    formulaIdOrSlug?: string;
  };

  if (!payload.formulaIdOrSlug?.trim()) {
    return NextResponse.json(
      {
        error: "formulaIdOrSlug is required",
      },
      { status: 400 },
    );
  }

  const result = await regenerateContentAssistDraft({
    formulaIdOrSlug: payload.formulaIdOrSlug.trim(),
  });

  if (!result) {
    return NextResponse.json(
      {
        error: "Formula not found",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: result.draft,
  });
}
