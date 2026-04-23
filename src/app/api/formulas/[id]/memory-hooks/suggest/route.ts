import { NextResponse } from "next/server";

import { suggestFormulaMemoryHooks } from "@/server/services/formula-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const hooks = await suggestFormulaMemoryHooks({
    formulaIdOrSlug: id,
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
