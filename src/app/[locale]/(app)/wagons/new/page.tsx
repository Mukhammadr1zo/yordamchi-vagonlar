import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link, redirect } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { WagonRecordForm } from "@/components/wagons/wagon-record-form";

export const dynamic = "force-dynamic";

export default async function NewWagonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!can((await getCurrentUser())?.role).editData) redirect({ href: "/dashboard", locale });
  const t = await getTranslations("wagons");

  const [admins, stations] = await Promise.all([
    prisma.administration.findMany({
      orderBy: { code: "asc" },
      select: { code: true, nameUz: true, nameRu: true },
    }),
    prisma.station.findMany({
      orderBy: { nameUz: "asc" },
      select: { code: true, nameUz: true, nameRu: true },
    }),
  ]);

  const adminOpts = admins.map((a) => ({
    code: a.code,
    name: locale === "ru" ? a.nameRu : a.nameUz,
  }));
  const stationOpts = stations.map((s) => ({
    code: s.code,
    name: locale === "ru" ? s.nameRu : s.nameUz,
  }));

  return (
    <div className="space-y-4 p-4 md:p-8">
      <Link
        href="/wagons"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        {t("title")}
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">{t("addManual")}</h1>
      <WagonRecordForm mode="create" administrations={adminOpts} stations={stationOpts} />
    </div>
  );
}
