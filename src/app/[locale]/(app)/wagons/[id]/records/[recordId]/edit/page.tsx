import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Link, redirect } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { WagonRecordForm } from "@/components/wagons/wagon-record-form";
import type { RecordInput } from "@/lib/wagon/types";

const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export const dynamic = "force-dynamic";

export default async function EditRecordPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; recordId: string }>;
}) {
  const { locale, id, recordId } = await params;
  setRequestLocale(locale);
  if (!can((await getCurrentUser())?.role).editData) redirect({ href: "/dashboard", locale });
  const t = await getTranslations("wagons");

  const [record, admins, stations] = await Promise.all([
    prisma.wagonRecord.findUnique({
      where: { id: recordId },
      include: { wagon: { include: { administration: true } } },
    }),
    prisma.administration.findMany({
      orderBy: { code: "asc" },
      select: { code: true, nameUz: true, nameRu: true },
    }),
    prisma.station.findMany({
      orderBy: { nameUz: "asc" },
      select: { code: true, nameUz: true, nameRu: true },
    }),
  ]);

  if (!record || record.wagonId !== id) notFound();

  const adminOpts = admins.map((a) => ({
    code: a.code,
    name: locale === "ru" ? a.nameRu : a.nameUz,
  }));
  const stationOpts = stations.map((s) => ({
    code: s.code,
    name: locale === "ru" ? s.nameRu : s.nameUz,
  }));

  const initial: Partial<RecordInput> = {
    wagonNumber: record.wagon.number,
    wagonType: record.wagon.wagonType ?? "",
    administrationCode: record.wagon.administration?.code ?? "",
    administrationName: record.wagon.administration
      ? locale === "ru"
        ? record.wagon.administration.nameRu
        : record.wagon.administration.nameUz
      : "",
    reportDate: iso(record.reportDate),
    sourceStation: record.sourceStation ?? "",
    factStation: record.factStationText ?? "",
    station5065: record.station5065Text ?? "",
    loadingStation: record.loadingStationText ?? "",
    loadingDate: iso(record.loadingDate),
    loadingDocStatus: record.loadingDocStatus,
    trainIndex: record.trainIndex ?? "",
    destinationStation: record.destinationStationText ?? "",
    unloadingDate: iso(record.unloadingDate),
    unloadingDocStatus: record.unloadingDocStatus,
    reportedLoadCount: record.reportedLoadCount,
  };

  return (
    <div className="space-y-4 p-4 md:p-8">
      <Link
        href={`/wagons/${id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        {record.wagon.number}
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">{t("editRecord")}</h1>
      <WagonRecordForm
        mode="edit"
        recordId={recordId}
        lockNumber
        initial={initial}
        administrations={adminOpts}
        stations={stationOpts}
      />
    </div>
  );
}
