import { NextResponse } from "next/server";

import { withAuthenticatedApi } from "@/server/auth/current-learner";
import {
  getFormulaMemoryHooks,
  saveFormulaMemoryHook,
} from "@/server/services/formula-service";

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
  };

  if (!payload.content?.trim()) {
    return NextResponse.json(
      {
        error: "content is required",
      },
      { status: 400 },
    );
  }

  const content = payload.content?.trim();

  return withAuthenticatedApi(async (current) => {
    const hook = await saveFormulaMemoryHook({
      formulaIdOrSlug: id,
      userId: current.learner.id,
      content: content!,
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
