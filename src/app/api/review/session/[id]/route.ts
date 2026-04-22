import { NextResponse } from "next/server";

import {
  getAnonymousUserFromCookies,
  setAnonymousSessionCookie,
} from "@/server/http/anonymous-user-cookie";
import { getReviewSessionSnapshot } from "@/server/services/review-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { user, sessionId } = await getAnonymousUserFromCookies();
  const snapshot = await getReviewSessionSnapshot({
    userId: user.id,
    sessionId: id,
  });

  if (!snapshot) {
    const response = NextResponse.json(
      {
        error: "Review session not found",
      },
      { status: 404 },
    );

    setAnonymousSessionCookie(response, sessionId);

    return response;
  }

  const response = NextResponse.json({
    data: snapshot,
  });

  setAnonymousSessionCookie(response, sessionId);

  return response;
}
