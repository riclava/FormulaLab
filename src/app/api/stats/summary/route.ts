import { NextResponse } from "next/server";

import {
  getAnonymousUserFromCookies,
  setAnonymousSessionCookie,
} from "@/server/http/anonymous-user-cookie";
import { getSummaryStats } from "@/server/services/stats-service";

export async function GET() {
  const { user, sessionId } = await getAnonymousUserFromCookies();
  const summary = await getSummaryStats({
    userId: user.id,
  });
  const response = NextResponse.json({
    data: summary,
  });
  setAnonymousSessionCookie(response, sessionId);
  return response;
}
