import { NextResponse } from "next/server";

import {
  getAnonymousUserFromCookies,
  setAnonymousSessionCookie,
} from "@/server/http/anonymous-user-cookie";
import { suggestFormulaMemoryHooks } from "@/server/services/formula-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { sessionId } = await getAnonymousUserFromCookies();
  const hooks = await suggestFormulaMemoryHooks({
    formulaIdOrSlug: id,
  });

  if (!hooks) {
    const response = NextResponse.json(
      {
        error: "Formula not found",
      },
      { status: 404 },
    );
    setAnonymousSessionCookie(response, sessionId);
    return response;
  }

  const response = NextResponse.json({
    data: hooks,
  });
  setAnonymousSessionCookie(response, sessionId);
  return response;
}
