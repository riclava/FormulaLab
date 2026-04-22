import { NextResponse } from "next/server";

import {
  getAnonymousUserFromCookies,
  setAnonymousSessionCookie,
} from "@/server/http/anonymous-user-cookie";
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

  const { user, sessionId } = await getAnonymousUserFromCookies();
  await recordStatsEvents({
    userId: user.id,
    events: validEvents,
  });

  const response = NextResponse.json({
    data: {
      recorded: validEvents.length,
    },
  });
  setAnonymousSessionCookie(response, sessionId);
  return response;
}
