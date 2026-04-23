import { NextResponse } from "next/server";

import { withAuthenticatedApi } from "@/server/auth/current-learner";
import {
  addCustomFormula,
  getFormulaCatalog,
} from "@/server/services/formula-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const domain = url.searchParams.get("domain") ?? undefined;
  const tag = url.searchParams.get("tag") ?? undefined;
  const query = url.searchParams.get("q") ?? undefined;
  const difficultyValue = url.searchParams.get("difficulty");
  const difficulty = difficultyValue ? Number(difficultyValue) : undefined;
  return withAuthenticatedApi(async (current) => {
    const catalog = await getFormulaCatalog({
      domain,
      tag,
      difficulty:
        typeof difficulty === "number" && Number.isFinite(difficulty)
          ? difficulty
          : undefined,
      query,
      userId: current.learner.id,
    });

    return NextResponse.json({
      data: catalog.formulas,
      meta: {
        filters: catalog.filters,
      },
    });
  });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    title?: string;
    expressionLatex?: string;
    domain?: string;
    subdomain?: string;
    oneLineUse?: string;
    meaning?: string;
    derivation?: string;
    useConditions?: string[];
    nonUseConditions?: string[];
    antiPatterns?: string[];
    typicalProblems?: string[];
    examples?: string[];
    difficulty?: number;
    tags?: string[];
    memoryHook?: string;
  };

  if (!payload.title?.trim() || !payload.expressionLatex?.trim() || !payload.oneLineUse?.trim()) {
    return NextResponse.json(
      {
        error: "title, expressionLatex and oneLineUse are required",
      },
      { status: 400 },
    );
  }

  const title = payload.title.trim();
  const expressionLatex = payload.expressionLatex.trim();
  const oneLineUse = payload.oneLineUse.trim();

  return withAuthenticatedApi(async (current) => {
    try {
      const formula = await addCustomFormula({
        userId: current.learner.id,
        input: {
          title,
          expressionLatex,
          domain: payload.domain,
          subdomain: payload.subdomain,
          oneLineUse,
          meaning: payload.meaning,
          derivation: payload.derivation,
          useConditions: payload.useConditions,
          nonUseConditions: payload.nonUseConditions,
          antiPatterns: payload.antiPatterns,
          typicalProblems: payload.typicalProblems,
          examples: payload.examples,
          difficulty: payload.difficulty,
          tags: payload.tags,
          memoryHook: payload.memoryHook,
        },
      });
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
  });
}
