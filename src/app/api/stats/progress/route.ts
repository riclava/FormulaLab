import { NextResponse } from "next/server";

import { getCurrentLearner } from "@/server/auth/current-learner";
import { getProgressStats } from "@/server/services/stats-service";

export async function GET() {
  const current = await getCurrentLearner();
  const progress = await getProgressStats({
    userId: current.learner.id,
  });
  return NextResponse.json({
    data: progress,
  });
}
