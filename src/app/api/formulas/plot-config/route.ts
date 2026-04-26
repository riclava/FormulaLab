import { NextResponse } from "next/server";

import { withAuthenticatedApi } from "@/server/auth/current-learner";
import {
  generateFormulaPlotConfigDraft,
  type FormulaPlotConfigInput,
} from "@/server/services/formula-plot-service";

export async function POST(request: Request) {
  const payload = (await request.json()) as FormulaPlotConfigInput;

  return withAuthenticatedApi(async () => {
    try {
      const plotConfig = await generateFormulaPlotConfigDraft(payload);

      return NextResponse.json({
        data: plotConfig,
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
