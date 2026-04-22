import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ANONYMOUS_SESSION_COOKIE,
  getOrCreateAnonymousUser,
} from "@/server/services/anonymous-user-service";

export async function GET() {
  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get(ANONYMOUS_SESSION_COOKIE)?.value;
  const { user, sessionId, created } =
    await getOrCreateAnonymousUser(existingSessionId);

  const response = NextResponse.json({
    data: {
      id: user.id,
      displayName: user.displayName,
      anonymous: true,
      created,
    },
  });

  response.cookies.set(ANONYMOUS_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
