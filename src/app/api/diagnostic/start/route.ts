import { NextResponse } from "next/server";

import { withAuthenticatedApi } from "@/server/auth/current-learner";
import { startDiagnostic } from "@/server/services/diagnostic-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const domain = url.searchParams.get("domain") ?? undefined;

  return withAuthenticatedApi(async () => {
    const diagnostic = await startDiagnostic({ domain });

    return NextResponse.json({
      data: diagnostic,
    });
  });
}
