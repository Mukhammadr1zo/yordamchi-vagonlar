import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Prisma } from "@prisma/client";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { WagonsTable, type WagonRow } from "@/components/wagons/wagons-table";
import { WagonFilters } from "@/components/wagons/wagon-filters";
import { DayPicker } from "@/components/wagons/day-picker";

const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

export const dynamic = "force-dynamic";

export default async function WagonsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("wagons");

  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const date = typeof sp.date === "string" ? sp.date : "";
  const disc = sp.disc === "1";
  const undoc = sp.undoc === "1";

  const adminName = (a: { nameUz: string; nameRu: string } | null, fallback: string | null) =>
    a ? (locale === "ru" ? a.nameRu : a.nameUz) : fallback;

  let rows: WagonRow[];

  if (date) {
    // Kun bo'yicha snapshot — o'sha sanadagi yozuvlar
    const start = new Date(date);
    const end = new Date(date);
    end.setUTCDate(end.getUTCDate() + 1);
    const where: Prisma.WagonRecordWhereInput = { reportDate: { gte: start, lt: end } };
    if (q) where.wagon = { number: { contains: q } };
    if (disc) where.isDiscrepant = true;
    if (undoc)
      where.OR = [{ loadingDocStatus: "NO_DOC" }, { unloadingDocStatus: "NO_DOC" }];

    const records = await prisma.wagonRecord.findMany({
      where,
      include: { wagon: { include: { administration: true } } },
      orderBy: [{ wagon: { number: "asc" } }],
      take: 500,
    });
    rows = records.map((r) => ({
      id: r.wagon.id,
      number: r.wagon.number,
      factStation: r.factStationText,
      adminCode: r.wagon.administration?.code ?? null,
      adminName: adminName(r.wagon.administration, r.wagon.administrationText),
      loadingDoc: r.loadingDocStatus,
      loadingStation: r.loadingStationText,
      loadingDate: iso(r.loadingDate),
      trainIndex: r.trainIndex,
      destination: r.destinationStationText,
      unloadingDate: iso(r.unloadingDate),
      unloadingDoc: r.unloadingDocStatus,
      station5065: r.station5065Text,
      loadCount: r.wagon.totalLoadCount,
      isDiscrepant: r.isDiscrepant,
      hasUndocumented: r.wagon.hasUndocumented,
      latestRecordId: r.id,
    }));
  } else {
    // Joriy holat — har vagonning oxirgi yozuvi
    const where: Prisma.WagonWhereInput = {};
    if (q) where.number = { contains: q };
    if (disc) where.isDiscrepant = true;
    if (undoc) where.hasUndocumented = true;

    const wagons = await prisma.wagon.findMany({
      where,
      orderBy: [{ lastReportDate: "desc" }, { number: "asc" }],
      take: 300,
      include: {
        administration: true,
        records: { orderBy: { reportDate: "desc" }, take: 1 },
      },
    });
    rows = wagons.map((w) => {
      const r = w.records[0];
      return {
        id: w.id,
        number: w.number,
        factStation: w.currentFactStationText,
        adminCode: w.administration?.code ?? null,
        adminName: adminName(w.administration, w.administrationText),
        loadingDoc: r?.loadingDocStatus ?? "UNKNOWN",
        loadingStation: r?.loadingStationText ?? null,
        loadingDate: iso(r?.loadingDate ?? null),
        trainIndex: r?.trainIndex ?? null,
        destination: r?.destinationStationText ?? null,
        unloadingDate: iso(r?.unloadingDate ?? null),
        unloadingDoc: r?.unloadingDocStatus ?? "UNKNOWN",
        station5065: w.current5065StationText,
        loadCount: w.totalLoadCount,
        isDiscrepant: w.isDiscrepant,
        hasUndocumented: w.hasUndocumented,
        latestRecordId: r?.id ?? null,
      };
    });
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("title")}
          {date && <span className="text-muted-foreground ml-2 text-base font-normal">· {date}</span>}
        </h1>
        <Link href="/wagons/new" className={cn(buttonVariants({ size: "sm" }))}>
          <Plus className="size-4" />
          {t("addManual")}
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <WagonFilters />
        <DayPicker />
      </div>
      <WagonsTable rows={rows} />
    </div>
  );
}
