import { NextResponse } from "next/server";

import { getCurrentLearner } from "@/server/auth/current-learner";
import { getSummaryStats } from "@/server/services/stats-service";

export async function GET() {
  const current = await getCurrentLearner();
  const summary = await getSummaryStats({
    userId: current.learner.id,
  });
  return NextResponse.json({
    data: summary,
  });
}
