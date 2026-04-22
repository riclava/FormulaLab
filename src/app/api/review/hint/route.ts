import { NextResponse } from "next/server";

import {
  getAnonymousUserFromCookies,
  setAnonymousSessionCookie,
} from "@/server/http/anonymous-user-cookie";
import { getReviewHint } from "@/server/services/review-service";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    formulaId?: string;
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
  const hint = await getReviewHint({
    userId: user.id,
    formulaId: payload.formulaId,
  });
  const response = NextResponse.json({
    data: hint,
  });

  setAnonymousSessionCookie(response, sessionId);

  return response;
}
