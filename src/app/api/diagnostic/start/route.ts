import { NextResponse } from "next/server";

import {
  getAnonymousUserFromCookies,
  setAnonymousSessionCookie,
} from "@/server/http/anonymous-user-cookie";
import { startDiagnostic } from "@/server/services/diagnostic-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const domain = url.searchParams.get("domain") ?? undefined;
  const [{ sessionId }, diagnostic] = await Promise.all([
    getAnonymousUserFromCookies(),
    startDiagnostic({ domain }),
  ]);
  const response = NextResponse.json({
    data: diagnostic,
  });

  setAnonymousSessionCookie(response, sessionId);

  return response;
}
