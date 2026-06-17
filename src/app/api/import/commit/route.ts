import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildLookups } from "@/lib/import/lookups";
import { createWagonRecord } from "@/lib/wagon/record";
import { recomputeWagon } from "@/lib/wagon/recompute";
import type { ParsedRow } from "@/lib/import/types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !can(user.role).upload) {
      return NextResponse.json({ error: "Import uchun ruxsatingiz yo'q" }, { status: 403 });
    }
    const { batchId } = await req.json();
    if (!batchId) {
      return NextResponse.json({ error: "batchId yo'q" }, { status: 400 });
    }

    const batch = await prisma.importBatch.findUnique({
      where: { id: batchId },
      include: { rows: true },
    });
    if (!batch) {
      return NextResponse.json({ error: "Partiya topilmadi" }, { status: 404 });
    }
    if (batch.status === "COMMITTED") {
      return NextResponse.json({ error: "Partiya allaqachon tasdiqlangan" }, { status: 400 });
    }

    const lookups = await buildLookups();
    const rowsToCommit = batch.rows.filter((r) => r.status !== "ERROR");
    const touched = new Set<string>();
    let inserted = 0;

    await prisma.$transaction(
      async (tx) => {
        for (const row of rowsToCommit) {
          const p = row.rawJson as unknown as ParsedRow;
          if (!p.wagonNumber) continue;
          const wagonId = await createWagonRecord(tx, p, lookups, {
            reportDate: batch.reportDate,
            sourceStation: batch.sourceStation,
            importBatchId: batch.id,
          });
          touched.add(wagonId);
          inserted++;
        }

        for (const wagonId of touched) {
          await recomputeWagon(tx, wagonId);
        }

        await tx.importBatch.update({
          where: { id: batch.id },
          data: { status: "COMMITTED" },
        });
      },
      { timeout: 60000 },
    );

    return NextResponse.json({ ok: true, inserted, wagons: touched.size });
  } catch (e) {
    console.error("[import/commit]", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
