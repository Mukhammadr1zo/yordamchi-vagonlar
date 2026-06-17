import type { Prisma } from "@prisma/client";

type Db = Prisma.TransactionClient;

/**
 * Vagonning hosil bo'luvchi maydonlarini uning kunlik yozuvlaridan qayta hisoblaydi:
 * joriy dislokatsiya, yuklash soni (tizim sanaydi), nomuvofiqlik, hujjatsiz harakat,
 * kirish/oxirgi hisobot sanasi.
 */
export async function recomputeWagon(db: Db, wagonId: string): Promise<void> {
  const records = await db.wagonRecord.findMany({
    where: { wagonId },
    orderBy: { reportDate: "asc" },
  });

  if (records.length === 0) {
    await db.wagon.update({
      where: { id: wagonId },
      data: {
        currentFactStationId: null,
        current5065StationId: null,
        currentFactStationText: null,
        current5065StationText: null,
        totalLoadCount: 0,
        isDiscrepant: false,
        hasUndocumented: false,
        entryDate: null,
        lastReportDate: null,
      },
    });
    return;
  }

  const latest = records[records.length - 1];
  const loadingDays = new Set(
    records
      .filter((r) => r.loadingDate)
      .map((r) => r.loadingDate!.toISOString().slice(0, 10)),
  );
  const hasUndoc = records.some(
    (r) => r.loadingDocStatus === "NO_DOC" || r.unloadingDocStatus === "NO_DOC",
  );

  await db.wagon.update({
    where: { id: wagonId },
    data: {
      currentFactStationId: latest.factStationId,
      current5065StationId: latest.station5065Id,
      currentFactStationText: latest.factStationText,
      current5065StationText: latest.station5065Text,
      totalLoadCount: loadingDays.size,
      hasUndocumented: hasUndoc,
      isDiscrepant: latest.isDiscrepant,
      entryDate: records[0].reportDate,
      lastReportDate: latest.reportDate,
    },
  });
}
