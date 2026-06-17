import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseWorkbook } from "@/lib/import/parse";
import { buildLookups } from "@/lib/import/lookups";
import { validateRows } from "@/lib/import/process";
import type { PreviewSummary } from "@/lib/import/types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !can(user.role).upload) {
      return NextResponse.json({ error: "Import uchun ruxsatingiz yo'q" }, { status: 403 });
    }
    const form = await req.formData();
    const file = form.get("file");
    const sourceStation = (form.get("sourceStation") as string)?.trim() || null;
    const reportDateStr = form.get("reportDate") as string;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fayl yuklanmadi" }, { status: 400 });
    }
    if (!reportDateStr) {
      return NextResponse.json({ error: "Hisobot sanasi kiritilmadi" }, { status: 400 });
    }
    const reportDate = new Date(reportDateStr);
    if (isNaN(reportDate.getTime())) {
      return NextResponse.json({ error: "Hisobot sanasi noto'g'ri" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { rows, unmappedHeaders, columnMap } = await parseWorkbook(buffer);

    // Shablon mosligini tekshirish — "номер вагон" ustuni majburiy
    if (columnMap.wagonNumber === undefined) {
      const found = unmappedHeaders.length
        ? unmappedHeaders.join(", ")
        : "—";
      const looksLikeLoadingPlan =
        columnMap.loadingStation !== undefined && columnMap.factStation === undefined;
      return NextResponse.json(
        {
          error:
            "Bu fayl «ko'rinmas vagonlar» shabloniga mos emas: «номер вагон» (vagon raqami) ustuni topilmadi." +
            (looksLikeLoadingPlan
              ? " Bu «Погрузка / yuklash rejasi» hisobotiga o'xshaydi — u alohida modulda yuritiladi."
              : "") +
            ` Topilgan ustunlar: ${found}.`,
          foundHeaders: unmappedHeaders,
        },
        { status: 422 },
      );
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "Faylda ma'lumot qatori topilmadi" }, { status: 400 });
    }

    const lookups = await buildLookups();
    const validated = validateRows(rows, lookups);

    const validNumbers = new Set(
      validated
        .filter((v) => v.status !== "ERROR" && v.parsed.wagonNumber)
        .map((v) => v.parsed.wagonNumber!),
    );
    const existing = await prisma.wagon.findMany({
      where: { number: { in: [...validNumbers] } },
      select: { number: true },
    });
    const existingSet = new Set(existing.map((e) => e.number));
    let newWagons = 0;
    for (const n of validNumbers) if (!existingSet.has(n)) newWagons++;

    const summary: PreviewSummary = {
      total: validated.length,
      ok: validated.filter((v) => v.status === "OK").length,
      warnings: validated.filter((v) => v.status === "WARNING").length,
      errors: validated.filter((v) => v.status === "ERROR").length,
      newWagons,
      updatedWagons: validNumbers.size - newWagons,
    };

    const batch = await prisma.importBatch.create({
      data: {
        fileName: file.name,
        sourceStation,
        reportDate,
        totalRows: summary.total,
        successRows: summary.ok,
        warningRows: summary.warnings,
        errorRows: summary.errors,
        status: "PREVIEW",
        rows: {
          create: validated.map((v) => ({
            rowNumber: v.rowNumber,
            rawJson: v.parsed as unknown as Prisma.InputJsonValue,
            status: v.status,
            messages: v.messages,
          })),
        },
      },
    });

    return NextResponse.json({
      batchId: batch.id,
      summary,
      rows: validated,
      unmappedHeaders,
    });
  } catch (e) {
    console.error("[import/preview]", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
