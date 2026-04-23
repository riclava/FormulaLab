import { NextResponse } from "next/server";

import { withAuthenticatedApi } from "@/server/auth/current-learner";
import { getLatestDiagnosticResult } from "@/server/services/diagnostic-service";

export async function GET() {
  return withAuthenticatedApi(async (current) => {
    const result = await getLatestDiagnosticResult({
      userId: current.learner.id,
    });

    if (!result) {
      return NextResponse.json(
        {
          error: "Diagnostic result not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: result,
    });
  });
}
