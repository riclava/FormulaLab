import { NextResponse } from "next/server";

import { getCurrentLearner } from "@/server/auth/current-learner";
import { chooseFormulaMemoryHook } from "@/server/services/formula-service";

export async function POST(
  _request: Request,
  {
    params,
  }: { params: Promise<{ id: string; hookId: string }> },
) {
  const { id, hookId } = await params;
  const current = await getCurrentLearner();
  const hook = await chooseFormulaMemoryHook({
    formulaIdOrSlug: id,
    hookId,
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
}
