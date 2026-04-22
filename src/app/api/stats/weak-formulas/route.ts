import { NextResponse } from "next/server";

import {
  getAnonymousUserFromCookies,
  setAnonymousSessionCookie,
} from "@/server/http/anonymous-user-cookie";
import { getWeakFormulas } from "@/server/services/stats-service";

export async function GET() {
  const { user, sessionId } = await getAnonymousUserFromCookies();
  const formulas = await getWeakFormulas({
    userId: user.id,
  });
  const response = NextResponse.json({
    data: formulas,
  });
  setAnonymousSessionCookie(response, sessionId);
  return response;
}
