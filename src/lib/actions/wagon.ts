"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { buildLookups } from "@/lib/import/lookups";
import { createWagonRecord, updateWagonRecordData } from "@/lib/wagon/record";
import { recomputeWagon } from "@/lib/wagon/recompute";
import type { ParsedRow } from "@/lib/import/types";
import type { ActionResult, RecordInput } from "@/lib/wagon/types";

const norm = (s: string | null | undefined) =>
  (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();

function toParsed(input: RecordInput): ParsedRow {
  const wagonNumber = (input.wagonNumber ?? "").replace(/\D/g, "") || null;
  const fact = input.factStation?.trim() || null;
  const st5065 = input.station5065?.trim() || null;
  return {
    wagonNumber,
    administrationCode: input.administrationCode?.trim() || null,
    administrationName: input.administrationName?.trim() || null,
    factStation: fact,
    station5065: st5065,
    loadingStation: input.loadingStation?.trim() || null,
    destinationStation: input.destinationStation?.trim() || null,
    loadingDate: input.loadingDate || null,
    unloadingDate: input.unloadingDate || null,
    loadingDocStatus: input.loadingDocStatus ?? "UNKNOWN",
    unloadingDocStatus: input.unloadingDocStatus ?? "UNKNOWN",
    trainIndex: input.trainIndex?.trim() || null,
    reportedLoadCount: input.reportedLoadCount ?? null,
    isDiscrepant: !!fact && !!st5065 && norm(fact) !== norm(st5065),
  };
}

function revalidateAll(wagonId?: string) {
  for (const l of ["uz", "ru"]) {
    revalidatePath(`/${l}/wagons`);
    revalidatePath(`/${l}/dashboard`);
    revalidatePath(`/${l}/discrepancies`);
    if (wagonId) revalidatePath(`/${l}/wagons/${wagonId}`);
  }
}

export async function createRecordAction(input: RecordInput): Promise<ActionResult> {
  try {
    const p = toParsed(input);
    if (!p.wagonNumber) return { ok: false, error: "Vagon raqami kiritilmagan" };
    if (!input.reportDate) return { ok: false, error: "Hisobot sanasi kiritilmagan" };

    const lookups = await buildLookups();
    const wagonId = await prisma.$transaction(async (tx) => {
      const id = await createWagonRecord(tx, p, lookups, {
        reportDate: new Date(input.reportDate),
        sourceStation: input.sourceStation?.trim() || null,
      });
      if (input.wagonType !== undefined) {
        await tx.wagon.update({
          where: { id },
          data: { wagonType: input.wagonType?.trim() || null },
        });
      }
      await recomputeWagon(tx, id);
      return id;
    });

    revalidateAll(wagonId);
    return { ok: true, wagonId };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateRecordAction(
  recordId: string,
  input: RecordInput,
): Promise<ActionResult> {
  try {
    const p = toParsed(input);
    if (!p.wagonNumber) return { ok: false, error: "Vagon raqami kiritilmagan" };

    const lookups = await buildLookups();
    const wagonId = await prisma.$transaction(async (tx) => {
      const id = await updateWagonRecordData(tx, recordId, p, lookups, {
        reportDate: new Date(input.reportDate),
        sourceStation: input.sourceStation?.trim() || null,
      });
      if (input.wagonType !== undefined) {
        await tx.wagon.update({
          where: { id },
          data: { wagonType: input.wagonType?.trim() || null },
        });
      }
      await recomputeWagon(tx, id);
      return id;
    });

    revalidateAll(wagonId);
    return { ok: true, wagonId };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteRecordAction(recordId: string): Promise<ActionResult> {
  try {
    const rec = await prisma.wagonRecord.findUnique({
      where: { id: recordId },
      select: { wagonId: true },
    });
    if (!rec) return { ok: false, error: "Yozuv topilmadi" };

    await prisma.$transaction(async (tx) => {
      await tx.wagonRecord.delete({ where: { id: recordId } });
      await recomputeWagon(tx, rec.wagonId);
    });

    revalidateAll(rec.wagonId);
    return { ok: true, wagonId: rec.wagonId };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteWagonAction(wagonId: string): Promise<ActionResult> {
  try {
    await prisma.wagon.delete({ where: { id: wagonId } });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Import partiyasini va undan kelgan yozuvlarni o'chiradi, vagonlarni qayta hisoblaydi. */
export async function deleteImportBatchAction(batchId: string): Promise<ActionResult> {
  try {
    const recs = await prisma.wagonRecord.findMany({
      where: { importBatchId: batchId },
      select: { wagonId: true },
    });
    const wagonIds = [...new Set(recs.map((r) => r.wagonId))];

    await prisma.$transaction(
      async (tx) => {
        await tx.wagonRecord.deleteMany({ where: { importBatchId: batchId } });
        for (const wid of wagonIds) {
          const remaining = await tx.wagonRecord.count({ where: { wagonId: wid } });
          if (remaining === 0) await tx.wagon.delete({ where: { id: wid } });
          else await recomputeWagon(tx, wid);
        }
        await tx.importBatch.delete({ where: { id: batchId } });
      },
      { timeout: 60000 },
    );

    for (const l of ["uz", "ru"]) {
      revalidatePath(`/${l}/history`);
      revalidatePath(`/${l}/wagons`);
      revalidatePath(`/${l}/dashboard`);
      revalidatePath(`/${l}/stations`);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
