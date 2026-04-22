import { NextResponse } from "next/server";

import {
  getAnonymousUserFromCookies,
  setAnonymousSessionCookie,
} from "@/server/http/anonymous-user-cookie";
import { getLatestDiagnosticResult } from "@/server/services/diagnostic-service";

export async function GET() {
  const { user, sessionId } = await getAnonymousUserFromCookies();
  const result = await getLatestDiagnosticResult({
    userId: user.id,
  });

  if (!result) {
    const response = NextResponse.json(
      {
        error: "Diagnostic result not found",
      },
      { status: 404 },
    );

    setAnonymousSessionCookie(response, sessionId);

    return response;
  }

  const response = NextResponse.json({
    data: result,
  });

  setAnonymousSessionCookie(response, sessionId);

  return response;
}
