import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { ImportForm } from "@/components/import/import-form";

export const dynamic = "force-dynamic";

export default async function ImportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("import");

  const stations = await prisma.station.findMany({
    orderBy: { nameUz: "asc" },
    select: { code: true, nameUz: true, nameRu: true },
  });

  const stationOptions = stations.map((s) => ({
    code: s.code,
    name: locale === "ru" ? s.nameRu : s.nameUz,
  }));

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>
      <ImportForm stations={stationOptions} />
    </div>
  );
}
