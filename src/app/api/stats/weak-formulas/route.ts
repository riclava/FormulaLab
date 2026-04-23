import { NextResponse } from "next/server";

import { withAuthenticatedApi } from "@/server/auth/current-learner";
import { getWeakFormulas } from "@/server/services/stats-service";

export async function GET() {
  return withAuthenticatedApi(async (current) => {
    const formulas = await getWeakFormulas({
      userId: current.learner.id,
    });

    return NextResponse.json({
      data: formulas,
    });
  });
}
