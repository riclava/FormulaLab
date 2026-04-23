import { NextResponse } from "next/server";

import { withAuthenticatedApi } from "@/server/auth/current-learner";
import { getSummaryStats } from "@/server/services/stats-service";

export async function GET() {
  return withAuthenticatedApi(async (current) => {
    const summary = await getSummaryStats({
      userId: current.learner.id,
    });

    return NextResponse.json({
      data: summary,
    });
  });
}
