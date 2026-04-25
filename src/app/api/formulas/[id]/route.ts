import { NextResponse } from "next/server";

import { normalizeRouteParam } from "@/lib/route-params";
import { withAuthenticatedApi } from "@/server/auth/current-learner";
import { getFormulaDetail } from "@/server/services/formula-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = normalizeRouteParam(rawId);
  return withAuthenticatedApi(async (current) => {
    const formula = await getFormulaDetail({
      idOrSlug: id,
      userId: current.learner.id,
    });

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
  });
}
