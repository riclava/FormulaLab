import { NextResponse } from "next/server";

import { getFormulaDetail } from "@/server/services/formula-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const formula = await getFormulaDetail(id);

  if (!formula) {
    return NextResponse.json(
      {
        error: "Formula not found",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: formula,
  });
}
