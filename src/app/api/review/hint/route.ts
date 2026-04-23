import { NextResponse } from "next/server";

import { getCurrentLearner } from "@/server/auth/current-learner";
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

  const current = await getCurrentLearner();
  const hint = await getReviewHint({
    userId: current.learner.id,
    formulaId: payload.formulaId,
  });
  return NextResponse.json({
    data: hint,
  });
}
