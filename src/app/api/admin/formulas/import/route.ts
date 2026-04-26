import { NextResponse } from "next/server";

import { requireCurrentAdmin } from "@/server/auth/current-learner";
import { importOfficialFormulaLibrary } from "@/server/services/formula-maintenance-service";
import type { OfficialFormulaInput } from "@/server/services/formula-maintenance-service";

export async function POST(request: Request) {
  await requireCurrentAdmin();

  try {
    const payload = (await request.json()) as {
      formulas?: OfficialFormulaInput[];
      dryRun?: boolean;
    };
    const result = await importOfficialFormulaLibrary({
      formulas: Array.isArray(payload.formulas) ? payload.formulas : [],
      dryRun: payload.dryRun !== false,
    });

    return NextResponse.json(
      {
        data: result,
      },
      { status: result.ok ? 200 : 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to import formulas",
      },
      { status: 400 },
    );
  }
}
