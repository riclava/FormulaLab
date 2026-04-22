import { NextResponse } from "next/server";

import {
  getAnonymousUserFromCookies,
  setAnonymousSessionCookie,
} from "@/server/http/anonymous-user-cookie";
import {
  addUserFormulaMemoryHook,
  adoptAiMemoryHook,
  getFormulaMemoryHooks,
} from "@/server/services/formula-service";
import type { MemoryHookType } from "@/types/memory-hook";

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
    type?: MemoryHookType;
    sourceHookId?: string;
  };

  if (!payload.content?.trim() && !payload.sourceHookId) {
    return NextResponse.json(
      {
        error: "content or sourceHookId is required",
      },
      { status: 400 },
    );
  }

  const { user, sessionId } = await getAnonymousUserFromCookies();
  const hook = payload.sourceHookId
    ? await adoptAiMemoryHook({
        formulaIdOrSlug: id,
        sourceHookId: payload.sourceHookId,
        userId: user.id,
        content: payload.content?.trim(),
        prompt: payload.prompt?.trim() || undefined,
        type: payload.type,
      })
    : await addUserFormulaMemoryHook({
        formulaIdOrSlug: id,
        userId: user.id,
        content: payload.content!.trim(),
        prompt: payload.prompt?.trim() || undefined,
        type: payload.type,
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
