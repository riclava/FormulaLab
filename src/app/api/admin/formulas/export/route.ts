import { NextResponse } from "next/server";

import { requireCurrentAdmin } from "@/server/auth/current-learner";
import { exportOfficialFormulaLibrary } from "@/server/services/formula-maintenance-service";

export async function GET() {
  await requireCurrentAdmin();
  const payload = await exportOfficialFormulaLibrary();

  return NextResponse.json(payload);
}
