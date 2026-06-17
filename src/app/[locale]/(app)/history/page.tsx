import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteImportButton } from "@/components/wagons/delete-buttons";

const d = (x: Date) => x.toISOString().slice(0, 10);
const dt = (x: Date) => x.toISOString().slice(0, 16).replace("T", " ");

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("history");
  const tc = await getTranslations("common");

  const batches = await prisma.importBatch.findMany({
    orderBy: { uploadedAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {batches.length === 0 ? (
            <div className="text-muted-foreground p-6 text-center text-sm">{tc("noData")}</div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>{t("reportDate")}</TableHead>
                    <TableHead>{t("file")}</TableHead>
                    <TableHead>{t("sourceStation")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="text-center">{t("rows")}</TableHead>
                    <TableHead>{t("uploadedAt")}</TableHead>
                    <TableHead className="text-right">{tc("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="whitespace-nowrap tabular-nums">{d(b.reportDate)}</TableCell>
                      <TableCell className="max-w-[260px] truncate">{b.fileName}</TableCell>
                      <TableCell>{b.sourceStation ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={b.status === "COMMITTED" ? "default" : "secondary"}>
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {b.successRows}/{b.totalRows}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap text-xs tabular-nums">
                        {dt(b.uploadedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DeleteImportButton batchId={b.id} fileName={b.fileName} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
