import { NextResponse } from "next/server";

import { normalizeRouteParam } from "@/lib/route-params";
import { requireCurrentAdmin } from "@/server/auth/current-learner";
import {
  deleteOfficialFormula,
  getOfficialFormulaMaintenanceDetail,
  updateOfficialFormula,
} from "@/server/services/formula-maintenance-service";
import type { OfficialFormulaInput } from "@/server/services/formula-maintenance-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  await requireCurrentAdmin();
  const { slug: rawSlug } = await params;
  const slug = normalizeRouteParam(rawSlug);
  const formula = await getOfficialFormulaMaintenanceDetail(slug);

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
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  await requireCurrentAdmin();
  const { slug: rawSlug } = await params;
  const slug = normalizeRouteParam(rawSlug);

  try {
    const payload = (await request.json()) as OfficialFormulaInput;
    const formula = await updateOfficialFormula(slug, payload);

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
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  await requireCurrentAdmin();
  const { slug: rawSlug } = await params;
  const slug = normalizeRouteParam(rawSlug);
  const result = await deleteOfficialFormula(slug);

  if (!result) {
    return NextResponse.json(
      {
        error: "Formula not found",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: result,
  });
}
