import { NextResponse } from "next/server";

import { getCurrentLearner } from "@/server/auth/current-learner";
import { getReviewSessionSnapshot } from "@/server/services/review-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const current = await getCurrentLearner();
  const snapshot = await getReviewSessionSnapshot({
    userId: current.learner.id,
    sessionId: id,
  });

  if (!snapshot) {
    return NextResponse.json(
      {
        error: "Review session not found",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: snapshot,
  });
}
