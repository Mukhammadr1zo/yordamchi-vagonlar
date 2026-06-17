import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Train, TriangleAlert, FileWarning, MapPin } from "lucide-react";
import { ChartDrilldown, type DrillRow } from "@/components/charts/chart-drilldown";
import { FlowSankey, type SankeyData } from "@/components/charts/flow-sankey";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  const [total, discrepant, undocumented, inCountry, wagons, records, recentImports] =
    await Promise.all([
      prisma.wagon.count(),
      prisma.wagon.count({ where: { isDiscrepant: true } }),
      prisma.wagon.count({ where: { hasUndocumented: true } }),
      prisma.wagon.count({ where: { status: "IN_COUNTRY" } }),
      prisma.wagon.findMany({ include: { administration: true } }),
      prisma.wagonRecord.findMany({
        select: { reportDate: true, wagonId: true },
        orderBy: { reportDate: "asc" },
      }),
      prisma.importBatch.findMany({
        where: { status: "COMMITTED" },
        orderBy: { uploadedAt: "desc" },
        take: 6,
      }),
    ]);

  type W = (typeof wagons)[number];
  const adminName = (w: W) =>
    w.administration
      ? locale === "ru"
        ? w.administration.nameRu
        : w.administration.nameUz
      : w.administrationText || "—";
  const drill = (w: W): DrillRow => ({
    id: w.id,
    number: w.number,
    admin: adminName(w),
    factStation: w.currentFactStationText,
    station5065: w.current5065StationText,
    loadCount: w.totalLoadCount,
    isDiscrepant: w.isDiscrepant,
  });

  function agg(keyFn: (w: W) => string) {
    const counts = new Map<string, number>();
    const det: Record<string, DrillRow[]> = {};
    for (const w of wagons) {
      const k = keyFn(w);
      counts.set(k, (counts.get(k) ?? 0) + 1);
      (det[k] ??= []).push(drill(w));
    }
    const data = [...counts].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    return { data, det };
  }

  const adminAgg = agg(adminName);
  const typeAgg = agg((w) => w.wagonType || t("typeUnknown"));
  const stationAgg = agg((w) => w.currentFactStationText || "—");
  const topStations = stationAgg.data.slice(0, 10).map((d) => ({ label: d.name, value: d.value }));

  // Hujjat holati
  const docDet: Record<string, DrillRow[]> = {
    [t("documented")]: wagons.filter((w) => !w.hasUndocumented).map(drill),
    [t("undocumented")]: wagons.filter((w) => w.hasUndocumented).map(drill),
  };
  const docData = [
    { name: t("documented"), value: total - undocumented },
    { name: t("undocumented"), value: undocumented },
  ].filter((d) => d.value > 0);

  // Sankey — davlat → haqiqiy stansiya
  const adminNames = [...new Set(wagons.map(adminName))];
  const stationNames = [...new Set(wagons.map((w) => w.currentFactStationText || "—"))];
  const linkMap = new Map<string, number>();
  for (const w of wagons) {
    const a = adminNames.indexOf(adminName(w));
    const s = adminNames.length + stationNames.indexOf(w.currentFactStationText || "—");
    linkMap.set(`${a}|${s}`, (linkMap.get(`${a}|${s}`) ?? 0) + 1);
  }
  const sankey: SankeyData = {
    nodes: [...adminNames, ...stationNames].map((name) => ({ name })),
    links: [...linkMap].map(([k, value]) => {
      const [source, target] = k.split("|").map(Number);
      return { source, target, value };
    }),
  };

  // Kunlik — yozuvlar + drilldown (o'sha kundagi vagonlar)
  const wagonById = new Map(wagons.map((w) => [w.id, w]));
  const dayCount = new Map<string, number>();
  const daySeen: Record<string, Set<string>> = {};
  const dayDet: Record<string, DrillRow[]> = {};
  for (const r of records) {
    const d = r.reportDate.toISOString().slice(5, 10);
    dayCount.set(d, (dayCount.get(d) ?? 0) + 1);
    (daySeen[d] ??= new Set());
    if (!daySeen[d].has(r.wagonId)) {
      daySeen[d].add(r.wagonId);
      const w = wagonById.get(r.wagonId);
      if (w) (dayDet[d] ??= []).push(drill(w));
    }
  }
  const daily = [...dayCount].map(([label, value]) => ({ label, value }));

  const stats = [
    { label: t("totalWagons"), value: total, icon: Train, tone: "text-blue-600", bg: "bg-blue-500/10" },
    { label: t("discrepant"), value: discrepant, icon: TriangleAlert, tone: "text-amber-600", bg: "bg-amber-500/10" },
    { label: t("undocumented"), value: undocumented, icon: FileWarning, tone: "text-red-600", bg: "bg-red-500/10" },
    { label: t("inCountry"), value: inCountry, icon: MapPin, tone: "text-emerald-600", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-xl p-3 ${s.bg}`}>
                <s.icon className={`size-6 ${s.tone}`} />
              </div>
              <div>
                <div className="text-3xl font-bold tabular-nums leading-none">{s.value}</div>
                <div className="text-muted-foreground mt-1 text-xs">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-muted-foreground -mb-2 text-xs">{t("clickHint")}</p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title={t("byAdministration")}>
          <ChartDrilldown variant="pie" data={adminAgg.data} details={adminAgg.det} />
        </ChartCard>
        <ChartCard title={t("flow")} className="lg:col-span-2">
          <FlowSankey data={sankey} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title={t("topStations")} className="lg:col-span-2">
          <ChartDrilldown variant="rank" data={topStations} details={stationAgg.det} />
        </ChartCard>
        <ChartCard title={t("byType")}>
          <ChartDrilldown variant="pie" data={typeAgg.data} details={typeAgg.det} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title={t("daily")} className="lg:col-span-2">
          <ChartDrilldown variant="daily" data={daily} details={dayDet} />
        </ChartCard>
        <ChartCard title={t("docStatusTitle")}>
          <ChartDrilldown variant="pie" data={docData} details={docDet} />
        </ChartCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("recentImports")}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentImports.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("empty")}</p>
          ) : (
            <ul className="divide-y text-sm">
              {recentImports.map((b) => (
                <li key={b.id} className="flex justify-between py-2">
                  <span>{b.fileName}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {b.successRows}/{b.totalRows}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ChartCard({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
