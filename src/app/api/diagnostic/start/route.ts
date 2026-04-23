import { NextResponse } from "next/server";

import { getCurrentLearner } from "@/server/auth/current-learner";
import { startDiagnostic } from "@/server/services/diagnostic-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const domain = url.searchParams.get("domain") ?? undefined;
  const [, diagnostic] = await Promise.all([
    getCurrentLearner(),
    startDiagnostic({ domain }),
  ]);
  return NextResponse.json({
    data: diagnostic,
  });
}
