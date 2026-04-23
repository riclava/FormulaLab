import { NextResponse } from "next/server";

import { withAuthenticatedApi } from "@/server/auth/current-learner";
import { getProgressStats } from "@/server/services/stats-service";

export async function GET() {
  return withAuthenticatedApi(async (current) => {
    const progress = await getProgressStats({
      userId: current.learner.id,
    });

    return NextResponse.json({
      data: progress,
    });
  });
}
