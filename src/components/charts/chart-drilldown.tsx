"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminPie } from "./admin-pie";
import { RankBar } from "./rank-bar";
import { DailyBar } from "./daily-bar";

export type DrillRow = {
  id: string;
  number: string;
  admin: string | null;
  factStation: string | null;
  station5065: string | null;
  loadCount: number;
  isDiscrepant: boolean;
};

type Pt = { name?: string; label?: string; value: number };

export function ChartDrilldown({
  variant,
  data,
  details,
}: {
  variant: "pie" | "rank" | "daily";
  data: Pt[];
  details: Record<string, DrillRow[]>;
}) {
  const t = useTranslations("wagons");
  const tc = useTranslations("common");
  const [key, setKey] = useState<string | null>(null);
  const rows = key ? (details[key] ?? []) : [];

  const chart =
    variant === "pie" ? (
      <AdminPie data={data as { name: string; value: number }[]} onSelect={setKey} />
    ) : variant === "rank" ? (
      <RankBar data={data as { label: string; value: number }[]} onSelect={setKey} />
    ) : (
      <DailyBar data={data as { label: string; value: number }[]} onSelect={setKey} />
    );

  return (
    <>
      {chart}
      <Dialog open={!!key} onOpenChange={(o) => !o && setKey(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {key} · {rows.length}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-md border">
            <Table>
              <TableHeader className="bg-muted sticky top-0">
                <TableRow>
                  <TableHead>{t("number")}</TableHead>
                  <TableHead>{t("administration")}</TableHead>
                  <TableHead>{t("factStation")}</TableHead>
                  <TableHead>{t("station5065")}</TableHead>
                  <TableHead className="text-center">{t("loadCount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono font-medium">
                      <Link href={`/wagons/${r.id}`} className="hover:underline">
                        {r.number}
                      </Link>
                    </TableCell>
                    <TableCell>{r.admin ?? "—"}</TableCell>
                    <TableCell className={r.isDiscrepant ? "text-amber-600" : ""}>
                      {r.factStation ?? "—"}
                    </TableCell>
                    <TableCell>{r.station5065 ?? "—"}</TableCell>
                    <TableCell className="text-center tabular-nums">{r.loadCount}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-center">
                      {tc("noData")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
