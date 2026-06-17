import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  TriangleAlert,
  FileWarning,
  Pencil,
  MapPin,
  ArrowRight,
} from "lucide-react";
import {
  DeleteWagonButton,
  DeleteRecordButton,
} from "@/components/wagons/delete-buttons";

const fmt = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "—");

export default async function WagonCardPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("wagons");
  const td = await getTranslations("docStatus");
  const tc = await getTranslations("common");
  const tf = await getTranslations("form");

  const wagon = await prisma.wagon.findUnique({
    where: { id },
    include: {
      administration: true,
      records: { orderBy: { reportDate: "desc" } },
    },
  });
  if (!wagon) notFound();

  const adminName = wagon.administration
    ? locale === "ru"
      ? wagon.administration.nameRu
      : wagon.administration.nameUz
    : wagon.administrationText;

  const details: [string, string][] = [
    [t("administration"), adminName ?? "—"],
    [tf("wagonType"), wagon.wagonType ?? "—"],
    [t("factStation"), wagon.currentFactStationText ?? "—"],
    [t("station5065"), wagon.current5065StationText ?? "—"],
    [t("loadCount"), String(wagon.totalLoadCount)],
    [t("entryDate"), fmt(wagon.entryDate)],
    [t("lastReport"), fmt(wagon.lastReportDate)],
  ];

  // Barcha xom ustunlar (Excel sarlavhalari) birlashmasi
  const rawKeys: string[] = [];
  for (const r of wagon.records) {
    const raw = (r.rawData as Record<string, string> | null) ?? null;
    if (raw) for (const k of Object.keys(raw)) if (!rawKeys.includes(k)) rawKeys.push(k);
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <Link
        href="/wagons"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        {t("title")}
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-3xl font-bold tracking-tight">{wagon.number}</h1>
        <Badge variant={wagon.status === "IN_COUNTRY" ? "default" : "secondary"}>
          {wagon.status === "IN_COUNTRY" ? t("inCountry") : t("departed")}
        </Badge>
        {wagon.isDiscrepant && (
          <Badge className="gap-1 bg-amber-500/15 text-amber-600">
            <TriangleAlert className="size-3" />
            {t("discrepant")}
          </Badge>
        )}
        {wagon.hasUndocumented && (
          <Badge className="gap-1 bg-red-500/15 text-red-600">
            <FileWarning className="size-3" />
            без док.
          </Badge>
        )}
        <div className="ml-auto flex gap-2">
          {wagon.records[0] && (
            <Link
              href={`/wagons/${wagon.id}/records/${wagon.records[0].id}/edit`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Pencil className="size-4" />
              {t("editLatest")}
            </Link>
          )}
          <DeleteWagonButton wagonId={wagon.id} number={wagon.number} />
        </div>
      </div>

      {/* Detal kartalar */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {details.map(([label, value], i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="text-muted-foreground text-xs">{label}</div>
              <div className="mt-1 font-medium break-words">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timeline — qaysi kun, qaysi stansiya */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("timeline")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-4 border-s pl-6">
            {wagon.records.map((r) => (
              <li key={r.id} className="relative">
                <span
                  className={cn(
                    "absolute -start-[27px] mt-1 size-3 rounded-full ring-4 ring-background",
                    r.isDiscrepant ? "bg-amber-500" : "bg-primary",
                  )}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums">{fmt(r.reportDate)}</span>
                  <MapPin className="text-muted-foreground size-3.5" />
                  <span className={cn("text-sm font-medium", r.isDiscrepant && "text-amber-600")}>
                    {r.factStationText ?? "—"}
                  </span>
                  {r.isDiscrepant && r.station5065Text && (
                    <span className="text-muted-foreground text-xs">
                      (5065: {r.station5065Text})
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  {r.loadingStationText && (
                    <span className="inline-flex items-center gap-1">
                      {r.loadingStationText}
                      {r.destinationStationText && (
                        <>
                          <ArrowRight className="size-3" />
                          {r.destinationStationText}
                        </>
                      )}
                    </span>
                  )}
                  {r.loadingDate && <span>погр: {fmt(r.loadingDate)}</span>}
                  {r.unloadingDate && <span>выгр: {fmt(r.unloadingDate)}</span>}
                  <span>
                    {td(r.loadingDocStatus)} / {td(r.unloadingDocStatus)}
                  </span>
                  {r.sourceStation && <span>· {r.sourceStation}</span>}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Barcha Excel ustunlari */}
      {rawKeys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("allColumns")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="whitespace-nowrap">{t("entryDate")}</TableHead>
                    {rawKeys.map((k) => (
                      <TableHead key={k} className="whitespace-nowrap text-xs">
                        {k}
                      </TableHead>
                    ))}
                    <TableHead className="text-right">{tc("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wagon.records.map((r) => {
                    const raw = (r.rawData as Record<string, string> | null) ?? {};
                    return (
                      <TableRow key={r.id} className={r.isDiscrepant ? "bg-amber-500/5" : ""}>
                        <TableCell className="whitespace-nowrap font-medium">{fmt(r.reportDate)}</TableCell>
                        {rawKeys.map((k) => (
                          <TableCell key={k} className="text-xs">
                            {raw[k] ?? "—"}
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/wagons/${wagon.id}/records/${r.id}/edit`}
                              className="text-muted-foreground hover:text-foreground p-1"
                              aria-label={tc("edit")}
                            >
                              <Pencil className="size-4" />
                            </Link>
                            <DeleteRecordButton recordId={r.id} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tuzilgan ustunlar (raw bo'lmaganlar uchun ham) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("history")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>{t("entryDate")}</TableHead>
                  <TableHead>{t("factStation")}</TableHead>
                  <TableHead>{t("station5065")}</TableHead>
                  <TableHead>погрузка</TableHead>
                  <TableHead>дата погр.</TableHead>
                  <TableHead>назначение</TableHead>
                  <TableHead>дата выгр.</TableHead>
                  <TableHead>СМГС</TableHead>
                  <TableHead className="text-right">{tc("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wagon.records.map((r) => (
                  <TableRow key={r.id} className={r.isDiscrepant ? "bg-amber-500/5" : ""}>
                    <TableCell className="whitespace-nowrap">{fmt(r.reportDate)}</TableCell>
                    <TableCell>{r.factStationText ?? "—"}</TableCell>
                    <TableCell>{r.station5065Text ?? "—"}</TableCell>
                    <TableCell>{r.loadingStationText ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{fmt(r.loadingDate)}</TableCell>
                    <TableCell>{r.destinationStationText ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{fmt(r.unloadingDate)}</TableCell>
                    <TableCell className="text-xs">
                      {td(r.loadingDocStatus)} / {td(r.unloadingDocStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/wagons/${wagon.id}/records/${r.id}/edit`}
                          className="text-muted-foreground hover:text-foreground p-1"
                          aria-label={tc("edit")}
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <DeleteRecordButton recordId={r.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
