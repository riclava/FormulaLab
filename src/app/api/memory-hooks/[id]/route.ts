import { NextResponse } from "next/server";

import {
  getAnonymousUserFromCookies,
  setAnonymousSessionCookie,
} from "@/server/http/anonymous-user-cookie";
import {
  removeMemoryHook,
  updateMemoryHook,
} from "@/server/services/formula-service";
import type { MemoryHookType } from "@/types/memory-hook";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const payload = (await request.json()) as {
    content?: string;
    prompt?: string | null;
    type?: MemoryHookType;
  };

  if (payload.content !== undefined && !payload.content.trim()) {
    return NextResponse.json(
      {
        error: "content cannot be empty",
      },
      { status: 400 },
    );
  }

  const { user, sessionId } = await getAnonymousUserFromCookies();

  const hook = await updateMemoryHook({
    hookId: id,
    userId: user.id,
    content: payload.content?.trim(),
    prompt: payload.prompt === undefined ? undefined : payload.prompt?.trim() || null,
    type: payload.type,
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { user, sessionId } = await getAnonymousUserFromCookies();
  const result = await removeMemoryHook({
    hookId: id,
    userId: user.id,
  });

  if (!result) {
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
    data: {
      id: result.id,
    },
  });
  setAnonymousSessionCookie(response, sessionId);
  return response;
}
