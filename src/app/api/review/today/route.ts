import { NextResponse } from "next/server";

import {
  getAnonymousUserFromCookies,
  setAnonymousSessionCookie,
} from "@/server/http/anonymous-user-cookie";
import { getTodayReviewSession } from "@/server/services/review-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") === "weak" ? "weak" : "today";
  const { user, sessionId } = await getAnonymousUserFromCookies();
  const session = await getTodayReviewSession({
    userId: user.id,
    mode,
  });
  const response = NextResponse.json({
    data: session,
  });

  setAnonymousSessionCookie(response, sessionId);

  return response;
}
