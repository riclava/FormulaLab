import { NextResponse } from "next/server";

import { withAuthenticatedApi } from "@/server/auth/current-learner";
import { getFormulaRelationDetails } from "@/server/services/formula-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAuthenticatedApi(async () => {
    const relations = await getFormulaRelationDetails(id);

    if (!relations) {
      return NextResponse.json(
        {
          error: "Formula not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: relations,
    });
  });
}
