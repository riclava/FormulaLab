import { NextResponse } from "next/server";

import { getCurrentLearner } from "@/server/auth/current-learner";
import { getWeakFormulas } from "@/server/services/stats-service";

export async function GET() {
  const current = await getCurrentLearner();
  const formulas = await getWeakFormulas({
    userId: current.learner.id,
  });
  return NextResponse.json({
    data: formulas,
  });
}
