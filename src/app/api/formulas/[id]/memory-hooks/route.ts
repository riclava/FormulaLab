import { NextResponse } from "next/server";

import { withAuthenticatedApi } from "@/server/auth/current-learner";
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
  return withAuthenticatedApi(async (current) => {
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

  const sourceHookId = payload.sourceHookId;
  const content = payload.content?.trim();
  const prompt = payload.prompt?.trim() || undefined;

  return withAuthenticatedApi(async (current) => {
    const hook = sourceHookId
      ? await adoptAiMemoryHook({
          formulaIdOrSlug: id,
          sourceHookId,
          userId: current.learner.id,
          content,
          prompt,
          type: payload.type,
        })
      : await addUserFormulaMemoryHook({
          formulaIdOrSlug: id,
          userId: current.learner.id,
          content: content!,
          prompt,
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
  });
}
