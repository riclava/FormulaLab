import { NextResponse } from "next/server";

import {
  getAnonymousUserFromCookies,
  setAnonymousSessionCookie,
} from "@/server/http/anonymous-user-cookie";
import { getFormulaCatalog } from "@/server/services/formula-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const domain = url.searchParams.get("domain") ?? undefined;
  const tag = url.searchParams.get("tag") ?? undefined;
  const query = url.searchParams.get("q") ?? undefined;
  const difficultyValue = url.searchParams.get("difficulty");
  const difficulty = difficultyValue ? Number(difficultyValue) : undefined;
  const { user, sessionId } = await getAnonymousUserFromCookies();
  const catalog = await getFormulaCatalog({
    domain,
    tag,
    difficulty:
      typeof difficulty === "number" && Number.isFinite(difficulty)
        ? difficulty
        : undefined,
    query,
    userId: user.id,
  });
  const response = NextResponse.json({
    data: catalog.formulas,
    meta: {
      filters: catalog.filters,
    },
  });

  setAnonymousSessionCookie(response, sessionId);

  return response;
}
