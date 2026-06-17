import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { StationFilters } from "@/components/stations/station-filters";
import { RankBar } from "@/components/charts/rank-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function StationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("stations");
  const tc = await getTranslations("common");

  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const admin = typeof sp.admin === "string" ? sp.admin : "";
  const type = typeof sp.type === "string" ? sp.type : "";

  const where: Prisma.WagonWhereInput = {};
  if (q) where.currentFactStationText = { contains: q, mode: "insensitive" };
  if (admin) where.administration = { code: admin };
  if (type) where.wagonType = type;
  if (sp.disc === "1") where.isDiscrepant = true;
  if (sp.undoc === "1") where.hasUndocumented = true;

  const [wagons, admins, typeRows] = await Promise.all([
    prisma.wagon.findMany({ where, include: { administration: true } }),
    prisma.administration.findMany({
      orderBy: { code: "asc" },
      select: { code: true, nameUz: true, nameRu: true },
    }),
    prisma.wagon.findMany({
      where: { wagonType: { not: null } },
      distinct: ["wagonType"],
      select: { wagonType: true },
    }),
  ]);

  const adminLabel = (w: (typeof wagons)[number]) =>
    w.administration
      ? locale === "ru"
        ? w.administration.nameRu
        : w.administration.nameUz
      : w.administrationText || "—";

  type Agg = {
    station: string;
    wagons: number;
    discrepant: number;
    undoc: number;
    loadings: number;
    admins: Set<string>;
  };
  const map = new Map<string, Agg>();
  for (const w of wagons) {
    const s = w.currentFactStationText || "—";
    let a = map.get(s);
    if (!a) {
      a = { station: s, wagons: 0, discrepant: 0, undoc: 0, loadings: 0, admins: new Set() };
      map.set(s, a);
    }
    a.wagons++;
    if (w.isDiscrepant) a.discrepant++;
    if (w.hasUndocumented) a.undoc++;
    a.loadings += w.totalLoadCount;
    a.admins.add(adminLabel(w));
  }
  const rows = [...map.values()].sort((x, y) => y.wagons - x.wagons);
  const chart = rows.slice(0, 10).map((r) => ({ label: r.station, value: r.wagons }));

  const adminOpts = admins.map((a) => ({
    code: a.code,
    name: locale === "ru" ? a.nameRu : a.nameUz,
  }));
  const typeOpts = typeRows.map((r) => r.wagonType!).filter(Boolean);

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>

      <StationFilters admins={adminOpts} types={typeOpts} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("top")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RankBar data={chart} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="text-muted-foreground p-6 text-center text-sm">{tc("noData")}</div>
            ) : (
              <div className="max-h-[420px] overflow-auto rounded-md border">
                <Table>
                  <TableHeader className="bg-muted sticky top-0">
                    <TableRow>
                      <TableHead>{t("station")}</TableHead>
                      <TableHead className="text-center">{t("wagons")}</TableHead>
                      <TableHead className="text-center">{t("discrepant")}</TableHead>
                      <TableHead className="text-center">{t("undocumented")}</TableHead>
                      <TableHead className="text-center">{t("loadings")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.station}>
                        <TableCell className="font-medium">
                          {r.station}
                          <div className="text-muted-foreground text-xs">
                            {[...r.admins].join(", ")}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold tabular-nums">{r.wagons}</TableCell>
                        <TableCell className="text-center tabular-nums text-amber-600">
                          {r.discrepant || "—"}
                        </TableCell>
                        <TableCell className="text-center tabular-nums text-red-600">
                          {r.undoc || "—"}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">{r.loadings}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
