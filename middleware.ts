import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  ANONYMOUS_SESSION_COOKIE,
  ANONYMOUS_SESSION_MAX_AGE,
} from "@/server/auth/session-cookies";

export function middleware(request: NextRequest) {
  if (request.cookies.has(ANONYMOUS_SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.cookies.set(ANONYMOUS_SESSION_COOKIE, crypto.randomUUID(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ANONYMOUS_SESSION_MAX_AGE,
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
