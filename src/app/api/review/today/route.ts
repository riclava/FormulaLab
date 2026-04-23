import { NextResponse } from "next/server";

import { getCurrentLearner } from "@/server/auth/current-learner";
import { getTodayReviewSession } from "@/server/services/review-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") === "weak" ? "weak" : "today";
  const current = await getCurrentLearner();
  const session = await getTodayReviewSession({
    userId: current.learner.id,
    mode,
  });
  return NextResponse.json({
    data: session,
  });
}
