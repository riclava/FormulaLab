import { NextResponse } from "next/server";

import { requireCurrentAdmin } from "@/server/auth/current-learner";
import { createOfficialFormula } from "@/server/services/formula-maintenance-service";
import type { OfficialFormulaInput } from "@/server/services/formula-maintenance-service";

export async function POST(request: Request) {
  await requireCurrentAdmin();

  try {
    const payload = (await request.json()) as OfficialFormulaInput;
    const formula = await createOfficialFormula(payload);

    return NextResponse.json(
      {
        data: formula,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create formula",
      },
      { status: 400 },
    );
  }
}
