import { NextResponse } from "next/server";

import {
  getAnonymousUserFromCookies,
  setAnonymousSessionCookie,
} from "@/server/http/anonymous-user-cookie";

export async function GET() {
  const { user, sessionId, created } = await getAnonymousUserFromCookies();

  const response = NextResponse.json({
    data: {
      id: user.id,
      displayName: user.displayName,
      anonymous: true,
      created,
    },
  });

  setAnonymousSessionCookie(response, sessionId);

  return response;
}
