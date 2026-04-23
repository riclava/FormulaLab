import { NextResponse } from "next/server";

import { withAuthenticatedApi } from "@/server/auth/current-learner";
import { getReviewHint } from "@/server/services/review-service";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    formulaId?: string;
  };

  if (!payload.formulaId) {
    return NextResponse.json(
      {
        error: "formulaId is required",
      },
      { status: 400 },
    );
  }

  const formulaId = payload.formulaId;

  return withAuthenticatedApi(async (current) => {
    const hint = await getReviewHint({
      userId: current.learner.id,
      formulaId,
    });

    return NextResponse.json({
      data: hint,
    });
  });
}
