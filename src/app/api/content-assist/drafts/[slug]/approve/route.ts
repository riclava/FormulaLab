import { NextResponse } from "next/server";

import { approveContentAssistDraft } from "@/server/services/content-assist-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const draft = await approveContentAssistDraft(slug);

  if (!draft) {
    return NextResponse.json(
      {
        error: "Draft not found",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: draft,
  });
}
