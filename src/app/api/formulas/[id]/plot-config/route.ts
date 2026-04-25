import { NextResponse } from "next/server";

import { normalizeRouteParam } from "@/lib/route-params";
import { withAuthenticatedApi } from "@/server/auth/current-learner";
import { generateAndSaveFormulaPlotConfig } from "@/server/services/formula-plot-service";
import { saveFormulaPlotConfig } from "@/server/services/formula-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = normalizeRouteParam(rawId);

  return withAuthenticatedApi(async (current) => {
    try {
      const formula = await generateAndSaveFormulaPlotConfig({
        formulaIdOrSlug: id,
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
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to generate plot config",
        },
        { status: 503 },
      );
    }
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = normalizeRouteParam(rawId);
  const payload = (await request.json()) as {
    plotConfig?: unknown;
  };

  if (!("plotConfig" in payload)) {
    return NextResponse.json(
      {
        error: "plotConfig is required",
      },
      { status: 400 },
    );
  }

  return withAuthenticatedApi(async (current) => {
    try {
      const formula = await saveFormulaPlotConfig({
        formulaIdOrSlug: id,
        userId: current.learner.id,
        plotConfig: payload.plotConfig,
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
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Failed to save plot config",
        },
        { status: 400 },
      );
    }
  });
}
