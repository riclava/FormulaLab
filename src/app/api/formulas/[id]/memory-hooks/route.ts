import { NextResponse } from "next/server";

import {
  getAnonymousUserFromCookies,
  setAnonymousSessionCookie,
} from "@/server/http/anonymous-user-cookie";
import {
  addUserFormulaMemoryHook,
  getFormulaMemoryHooks,
} from "@/server/services/formula-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { user, sessionId } = await getAnonymousUserFromCookies();
  const hooks = await getFormulaMemoryHooks({
    formulaIdOrSlug: id,
    userId: user.id,
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const payload = (await request.json()) as {
    content?: string;
    prompt?: string;
  };

  if (!payload.content?.trim()) {
    return NextResponse.json(
      {
        error: "content is required",
      },
      { status: 400 },
    );
  }

  const { user, sessionId } = await getAnonymousUserFromCookies();
  const hook = await addUserFormulaMemoryHook({
    formulaIdOrSlug: id,
    userId: user.id,
    content: payload.content.trim(),
    prompt: payload.prompt?.trim() || undefined,
  });

  if (!hook) {
    const response = NextResponse.json(
      {
        error: "Formula not found",
      },
      { status: 404 },
    );

    setAnonymousSessionCookie(response, sessionId);

    return response;
  }

  const response = NextResponse.json(
    {
      data: hook,
    },
    { status: 201 },
  );

  setAnonymousSessionCookie(response, sessionId);

  return response;
}
