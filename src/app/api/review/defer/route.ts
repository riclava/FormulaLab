import { NextResponse } from "next/server";

import { withAuthenticatedApi } from "@/server/auth/current-learner";
import { deferReview } from "@/server/services/review-service";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    formulaId?: string;
    minutes?: number;
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
    const result = await deferReview({
      userId: current.learner.id,
      formulaId,
      minutes: payload.minutes,
    });

    return NextResponse.json({
      data: result,
    });
  });
}
