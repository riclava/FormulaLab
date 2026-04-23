import { NextResponse } from "next/server";

import { getCurrentLearner } from "@/server/auth/current-learner";
import { recordStatsEvents } from "@/server/services/stats-service";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    events?: Array<{
      formulaId?: string;
      studySessionId?: string;
      type?: "weak_formula_impression" | "weak_formula_opened";
    }>;
  };

  if (!payload.events || payload.events.length === 0) {
    return NextResponse.json(
      {
        error: "events are required",
      },
      { status: 400 },
    );
  }

  const validEvents = payload.events.filter(
    (event) =>
      event.type === "weak_formula_impression" ||
      event.type === "weak_formula_opened",
  ) as Array<{
    formulaId?: string;
    studySessionId?: string;
    type: "weak_formula_impression" | "weak_formula_opened";
  }>;

  const current = await getCurrentLearner();
  await recordStatsEvents({
    userId: current.learner.id,
    events: validEvents,
  });

  return NextResponse.json({
    data: {
      recorded: validEvents.length,
    },
  });
}
