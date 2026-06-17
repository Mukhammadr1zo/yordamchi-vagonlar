"use client";

import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DeleteWagonButton } from "@/components/wagons/delete-buttons";

type Doc = "SMGS" | "NO_DOC" | "UNKNOWN";

export type WagonRow = {
  id: string;
  number: string;
  factStation: string | null;
  adminCode: string | null;
  adminName: string | null;
  loadingDoc: Doc;
  loadingStation: string | null;
  loadingDate: string | null;
  trainIndex: string | null;
  destination: string | null;
  unloadingDate: string | null;
  unloadingDoc: Doc;
  station5065: string | null;
  loadCount: number;
  isDiscrepant: boolean;
  hasUndocumented: boolean;
  latestRecordId: string | null;
};

function DocCell({ v, t }: { v: Doc; t: (k: string) => string }) {
  if (v === "UNKNOWN") return <span className="text-muted-foreground">—</span>;
  return (
    <span className={v === "NO_DOC" ? "text-red-600" : "text-emerald-600"}>{t(v)}</span>
  );
}

export function WagonsTable({ rows }: { rows: WagonRow[] }) {
  const t = useTranslations("wagons");
  const tf = useTranslations("form");
  const td = useTranslations("docStatus");
  const tc = useTranslations("common");

  const editCls =
    "text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-7 items-center justify-center rounded-md";

  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border p-8 text-center text-sm">
        {tc("noData")}
      </div>
    );
  }

  const dash = (v: string | null) => v ?? <span className="text-muted-foreground">—</span>;

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table className="text-sm">
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead className="w-8">#</TableHead>
            <TableHead className="whitespace-nowrap">{t("factStation")}</TableHead>
            <TableHead className="whitespace-nowrap">{t("number")}</TableHead>
            <TableHead className="whitespace-nowrap">{t("code")}</TableHead>
            <TableHead className="whitespace-nowrap">{t("administration")}</TableHead>
            <TableHead className="whitespace-nowrap">{tf("loadingDoc")}</TableHead>
            <TableHead className="whitespace-nowrap">{tf("loadingStation")}</TableHead>
            <TableHead className="whitespace-nowrap">{tf("loadingDate")}</TableHead>
            <TableHead className="whitespace-nowrap">{tf("trainIndex")}</TableHead>
            <TableHead className="whitespace-nowrap">{tf("destinationStation")}</TableHead>
            <TableHead className="whitespace-nowrap">{tf("unloadingDate")}</TableHead>
            <TableHead className="whitespace-nowrap">{tf("unloadingDoc")}</TableHead>
            <TableHead className="whitespace-nowrap">{t("station5065")}</TableHead>
            <TableHead className="whitespace-nowrap text-center">{t("loadCount")}</TableHead>
            <TableHead className="text-right">{tc("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((w, i) => (
            <TableRow key={w.id} className="hover:bg-muted/50">
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell
                className={cn(
                  "whitespace-nowrap",
                  w.isDiscrepant && "font-medium text-amber-600",
                )}
              >
                {dash(w.factStation)}
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono font-medium">
                <Link href={`/wagons/${w.id}`} className="hover:underline">
                  {w.number}
                </Link>
              </TableCell>
              <TableCell>{dash(w.adminCode)}</TableCell>
              <TableCell className="whitespace-nowrap">{dash(w.adminName)}</TableCell>
              <TableCell className="whitespace-nowrap">
                <DocCell v={w.loadingDoc} t={td} />
              </TableCell>
              <TableCell className="whitespace-nowrap">{dash(w.loadingStation)}</TableCell>
              <TableCell className="whitespace-nowrap tabular-nums">{dash(w.loadingDate)}</TableCell>
              <TableCell className="whitespace-nowrap">{dash(w.trainIndex)}</TableCell>
              <TableCell className="whitespace-nowrap">{dash(w.destination)}</TableCell>
              <TableCell className="whitespace-nowrap tabular-nums">{dash(w.unloadingDate)}</TableCell>
              <TableCell className="whitespace-nowrap">
                <DocCell v={w.unloadingDoc} t={td} />
              </TableCell>
              <TableCell className="whitespace-nowrap">{dash(w.station5065)}</TableCell>
              <TableCell className="text-center tabular-nums">{w.loadCount}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  {w.latestRecordId && (
                    <Link
                      href={`/wagons/${w.id}/records/${w.latestRecordId}/edit`}
                      className={editCls}
                      aria-label={tc("edit")}
                    >
                      <Pencil className="size-4" />
                    </Link>
                  )}
                  <DeleteWagonButton wagonId={w.id} number={w.number} compact />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
