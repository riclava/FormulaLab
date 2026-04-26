import { NextResponse } from "next/server";

import { normalizeRouteParam } from "@/lib/route-params";
import { withAuthenticatedApi } from "@/server/auth/current-learner";
import { getFormulaDetail, updatePersonalFormula } from "@/server/services/formula-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = normalizeRouteParam(rawId);
  return withAuthenticatedApi(async (current) => {
    const formula = await getFormulaDetail({
      idOrSlug: id,
      userId: current.learner.id,
    });

    if (!formula) {
      return NextResponse.json(
        {
          error: "Formula not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: formula,
    });
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = normalizeRouteParam(rawId);
  const payload = (await request.json()) as {
    title?: string;
    expressionLatex?: string;
    domain?: string;
    subdomain?: string | null;
    oneLineUse?: string;
    meaning?: string;
    intuition?: string | null;
    derivation?: string | null;
    useConditions?: string[];
    nonUseConditions?: string[];
    antiPatterns?: string[];
    typicalProblems?: string[];
    examples?: string[];
    plotConfig?: unknown;
    difficulty?: number;
    tags?: string[];
    variables?: Array<{
      symbol: string;
      name: string;
      description: string;
      unit?: string | null;
    }>;
    reviewItems?: Array<{
      type: "recall" | "recognition" | "application";
      prompt: string;
      answer: string;
      explanation?: string | null;
      difficulty: number;
    }>;
  };

  const title = payload.title?.trim() ?? "";
  const expressionLatex = payload.expressionLatex?.trim() ?? "";
  const oneLineUse = payload.oneLineUse?.trim() ?? "";

  if (!title || !expressionLatex || !oneLineUse) {
    return NextResponse.json(
      {
        error: "title, expressionLatex and oneLineUse are required",
      },
      { status: 400 },
    );
  }

  return withAuthenticatedApi(async (current) => {
    try {
      const formula = await updatePersonalFormula({
        idOrSlug: id,
        userId: current.learner.id,
        input: {
          title,
          expressionLatex,
          domain: payload.domain,
          subdomain: payload.subdomain,
          oneLineUse,
          meaning: payload.meaning,
          intuition: payload.intuition,
          derivation: payload.derivation,
          useConditions: payload.useConditions,
          nonUseConditions: payload.nonUseConditions,
          antiPatterns: payload.antiPatterns,
          typicalProblems: payload.typicalProblems,
          examples: payload.examples,
          plotConfig: payload.plotConfig,
          difficulty: payload.difficulty,
          tags: payload.tags,
          variables: payload.variables,
          reviewItems: payload.reviewItems,
        },
      });

      if (!formula) {
        return NextResponse.json(
          {
            error: "Formula not found",
          },
          { status: 404 },
        );
      }

      return NextResponse.json({
        data: formula,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Failed to update formula",
        },
        { status: 400 },
      );
    }
  });
}
