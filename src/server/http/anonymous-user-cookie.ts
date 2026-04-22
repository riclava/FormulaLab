import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import {
  ANONYMOUS_SESSION_COOKIE,
  getOrCreateAnonymousUser,
} from "@/server/services/anonymous-user-service";

const ANONYMOUS_COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export async function getAnonymousUserFromCookies() {
  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get(ANONYMOUS_SESSION_COOKIE)?.value;

  return getOrCreateAnonymousUser(existingSessionId);
}

export function setAnonymousSessionCookie(
  response: NextResponse,
  sessionId: string,
) {
  response.cookies.set(
    ANONYMOUS_SESSION_COOKIE,
    sessionId,
    ANONYMOUS_COOKIE_OPTIONS,
  );
}
