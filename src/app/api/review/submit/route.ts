import { NextResponse } from "next/server";

import {
  getAnonymousUserFromCookies,
  setAnonymousSessionCookie,
} from "@/server/http/anonymous-user-cookie";
import { submitReview } from "@/server/services/review-service";
import type { ReviewSubmitInput } from "@/types/review";

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<ReviewSubmitInput>;
  const error = validateSubmitPayload(payload);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const { user, sessionId } = await getAnonymousUserFromCookies();
  const result = await submitReview({
    userId: user.id,
    input: payload as ReviewSubmitInput,
  });
  const response = NextResponse.json({
    data: result,
  });

  setAnonymousSessionCookie(response, sessionId);

  return response;
}

function validateSubmitPayload(payload: Partial<ReviewSubmitInput>) {
  if (!payload.sessionId) {
    return "sessionId is required";
  }

  if (!payload.reviewItemId) {
    return "reviewItemId is required";
  }

  if (!payload.formulaId) {
    return "formulaId is required";
  }

  if (!payload.result) {
    return "result is required";
  }

  if (!["again", "hard", "good", "easy"].includes(payload.result)) {
    return "result is invalid";
  }

  return null;
}
