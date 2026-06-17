import type { Prisma } from "@prisma/client";
import { resolveAdminId, resolveStationId, type Lookups } from "@/lib/import/process";
import type { ParsedRow } from "@/lib/import/types";

type Db = Prisma.TransactionClient;

interface RecordMeta {
  reportDate: Date;
  sourceStation: string | null;
  importBatchId?: string | null;
}

/** Vagonni upsert qilib, unga yangi kunlik yozuv qo'shadi. wagonId qaytaradi. */
export async function createWagonRecord(
  db: Db,
  p: ParsedRow,
  lk: Lookups,
  meta: RecordMeta,
): Promise<string> {
  if (!p.wagonNumber) throw new Error("Vagon raqami yo'q");
  const adminId = resolveAdminId(lk, p.administrationCode, p.administrationName);
  const adminText = p.administrationName || p.administrationCode || null;

  const wagon = await db.wagon.upsert({
    where: { number: p.wagonNumber },
    update: {
      ...(adminId ? { administrationId: adminId } : {}),
      ...(adminText ? { administrationText: adminText } : {}),
    },
    create: {
      number: p.wagonNumber,
      administrationId: adminId ?? undefined,
      administrationText: adminText ?? undefined,
    },
  });

  await db.wagonRecord.create({
    data: { ...recordFields(p, lk), wagonId: wagon.id, ...meta },
  });

  return wagon.id;
}

/** Mavjud yozuvni tahrirlaydi. wagonId qaytaradi. */
export async function updateWagonRecordData(
  db: Db,
  recordId: string,
  p: ParsedRow,
  lk: Lookups,
  meta: { reportDate: Date; sourceStation: string | null },
): Promise<string> {
  const existing = await db.wagonRecord.findUnique({
    where: { id: recordId },
    select: { wagonId: true },
  });
  if (!existing) throw new Error("Yozuv topilmadi");

  await db.wagonRecord.update({
    where: { id: recordId },
    data: {
      ...recordFields(p, lk),
      reportDate: meta.reportDate,
      sourceStation: meta.sourceStation,
    },
  });

  const adminId = resolveAdminId(lk, p.administrationCode, p.administrationName);
  const adminText = p.administrationName || p.administrationCode || null;
  if (adminId || adminText) {
    await db.wagon.update({
      where: { id: existing.wagonId },
      data: {
        ...(adminId ? { administrationId: adminId } : {}),
        ...(adminText ? { administrationText: adminText } : {}),
      },
    });
  }

  return existing.wagonId;
}

/** ParsedRow -> WagonRecord ustunlari (stansiya/admin id va matn bilan) */
function recordFields(p: ParsedRow, lk: Lookups) {
  return {
    factStationId: resolveStationId(lk, p.factStation),
    factStationText: p.factStation,
    station5065Id: resolveStationId(lk, p.station5065),
    station5065Text: p.station5065,
    loadingStationId: resolveStationId(lk, p.loadingStation),
    loadingStationText: p.loadingStation,
    loadingDate: p.loadingDate ? new Date(p.loadingDate) : null,
    loadingDocStatus: p.loadingDocStatus,
    trainIndex: p.trainIndex,
    destinationStationId: resolveStationId(lk, p.destinationStation),
    destinationStationText: p.destinationStation,
    unloadingDate: p.unloadingDate ? new Date(p.unloadingDate) : null,
    unloadingDocStatus: p.unloadingDocStatus,
    administrationText: p.administrationName || p.administrationCode || null,
    reportedLoadCount: p.reportedLoadCount,
    isDiscrepant: p.isDiscrepant,
    rawData: p.raw && Object.keys(p.raw).length ? (p.raw as Prisma.InputJsonValue) : undefined,
  };
}
