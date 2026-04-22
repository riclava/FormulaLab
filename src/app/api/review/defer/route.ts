import { NextResponse } from "next/server";

import {
  getAnonymousUserFromCookies,
  setAnonymousSessionCookie,
} from "@/server/http/anonymous-user-cookie";
import { deferReview } from "@/server/services/review-service";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    formulaId?: string;
    minutes?: number;
  };

  if (!payload.formulaId) {
    return NextResponse.json(
      {
        error: "formulaId is required",
      },
      { status: 400 },
    );
  }

  const { user, sessionId } = await getAnonymousUserFromCookies();
  const result = await deferReview({
    userId: user.id,
    formulaId: payload.formulaId,
    minutes: payload.minutes,
  });
  const response = NextResponse.json({
    data: result,
  });

  setAnonymousSessionCookie(response, sessionId);

  return response;
}
