import { NextResponse } from "next/server";

import { getFormulaSummaries } from "@/server/services/formula-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const domain = url.searchParams.get("domain") ?? undefined;
  const query = url.searchParams.get("q") ?? undefined;
  const formulas = await getFormulaSummaries({ domain, query });

  return NextResponse.json({
    data: formulas,
  });
}
