import { NextResponse } from "next/server";

import { withAuthenticatedApi } from "@/server/auth/current-learner";
import { recordMemoryHookHelpful } from "@/server/services/formula-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAuthenticatedApi(async (current) => {
    const hook = await recordMemoryHookHelpful({
      hookId: id,
      userId: current.learner.id,
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
  });
}
