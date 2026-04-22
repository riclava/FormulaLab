import { NextResponse } from "next/server";

import {
  getAnonymousUserFromCookies,
  setAnonymousSessionCookie,
} from "@/server/http/anonymous-user-cookie";
import { getProgressStats } from "@/server/services/stats-service";

export async function GET() {
  const { user, sessionId } = await getAnonymousUserFromCookies();
  const progress = await getProgressStats({
    userId: user.id,
  });
  const response = NextResponse.json({
    data: progress,
  });
  setAnonymousSessionCookie(response, sessionId);
  return response;
}
