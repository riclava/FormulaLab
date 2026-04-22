import { NextResponse } from "next/server";

import {
  getAnonymousUserFromCookies,
  setAnonymousSessionCookie,
} from "@/server/http/anonymous-user-cookie";
import { recordMemoryHookHelpful } from "@/server/services/formula-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { user, sessionId } = await getAnonymousUserFromCookies();
  const hook = await recordMemoryHookHelpful({
    hookId: id,
    userId: user.id,
  });

  if (!hook) {
    const response = NextResponse.json(
      {
        error: "Memory hook not found",
      },
      { status: 404 },
    );
    setAnonymousSessionCookie(response, sessionId);
    return response;
  }

  const response = NextResponse.json({
    data: hook,
  });
  setAnonymousSessionCookie(response, sessionId);
  return response;
}
