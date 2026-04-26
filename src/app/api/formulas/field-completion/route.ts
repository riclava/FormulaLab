import { NextResponse } from "next/server";

import {
  isCurrentAdmin,
  withAuthenticatedApi,
} from "@/server/auth/current-learner";
import {
  generateFormulaFieldCompletion,
  type FormulaCompletionSection,
  type FormulaFieldCompletionFormula,
  type FormulaFieldCompletionMode,
  type FormulaFieldCompletionRelationOption,
  type FormulaFieldCompletionVariant,
} from "@/server/services/formula-field-completion-service";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    variant?: FormulaFieldCompletionVariant;
    mode?: FormulaFieldCompletionMode;
    target?: FormulaCompletionSection;
    formula?: FormulaFieldCompletionFormula;
    relationOptions?: FormulaFieldCompletionRelationOption[];
  };

  const variant = payload.variant;
  const mode = payload.mode;
  const target = payload.target?.trim();

  if (variant !== "official" && variant !== "custom") {
    return NextResponse.json({ error: "variant is required" }, { status: 400 });
  }

  if (mode !== "create" && mode !== "edit") {
    return NextResponse.json({ error: "mode is required" }, { status: 400 });
  }

  if (!target) {
    return NextResponse.json({ error: "target is required" }, { status: 400 });
  }

  if (!payload.formula || typeof payload.formula !== "object") {
    return NextResponse.json({ error: "formula is required" }, { status: 400 });
  }

  const formula = payload.formula;

  return withAuthenticatedApi(async () => {
    if (variant === "official" && !(await isCurrentAdmin())) {
      return NextResponse.json(
        {
          error: "Admin access is required",
        },
        { status: 403 },
      );
    }

    try {
      const completion = await generateFormulaFieldCompletion({
        variant,
        mode,
        target: target as FormulaCompletionSection,
        formula,
        relationOptions: payload.relationOptions,
      });

      return NextResponse.json({
        data: completion,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to generate field completion",
        },
        { status: 503 },
      );
    }
  });
}
