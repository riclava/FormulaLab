import { NextResponse } from "next/server";

import { getCurrentLearner } from "@/server/auth/current-learner";
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

  const current = await getCurrentLearner();

  const hook = await updateMemoryHook({
    hookId: id,
    userId: current.learner.id,
    content: payload.content?.trim(),
    prompt: payload.prompt === undefined ? undefined : payload.prompt?.trim() || null,
    type: payload.type,
  });

  if (!hook) {
    return NextResponse.json(
      {
        error: "Memory hook not found",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: hook,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const current = await getCurrentLearner();
  const result = await removeMemoryHook({
    hookId: id,
    userId: current.learner.id,
  });

  if (!result) {
    return NextResponse.json(
      {
        error: "Memory hook not found",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: {
      id: result.id,
    },
  });
}
