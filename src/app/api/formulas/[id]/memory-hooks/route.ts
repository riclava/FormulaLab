import { NextResponse } from "next/server";

import { getCurrentLearner } from "@/server/auth/current-learner";
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
  const current = await getCurrentLearner();
  const hooks = await getFormulaMemoryHooks({
    formulaIdOrSlug: id,
    userId: current.learner.id,
  });

  if (!hooks) {
    return NextResponse.json(
      {
        error: "Formula not found",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: hooks,
  });
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

  const current = await getCurrentLearner();
  const hook = payload.sourceHookId
    ? await adoptAiMemoryHook({
        formulaIdOrSlug: id,
        sourceHookId: payload.sourceHookId,
        userId: current.learner.id,
        content: payload.content?.trim(),
        prompt: payload.prompt?.trim() || undefined,
        type: payload.type,
      })
    : await addUserFormulaMemoryHook({
        formulaIdOrSlug: id,
        userId: current.learner.id,
        content: payload.content!.trim(),
        prompt: payload.prompt?.trim() || undefined,
        type: payload.type,
      });

  if (!hook) {
    return NextResponse.json(
      {
        error: "Formula not found",
      },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      data: hook,
    },
    { status: 201 },
  );
}
