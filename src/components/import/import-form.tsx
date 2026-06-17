"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Parsed = {
  wagonNumber: string | null;
  administrationCode: string | null;
  administrationName: string | null;
  factStation: string | null;
  station5065: string | null;
  loadingDate: string | null;
  unloadingDate: string | null;
  isDiscrepant: boolean;
};

type Row = {
  rowNumber: number;
  parsed: Parsed;
  status: "OK" | "WARNING" | "ERROR";
  messages: string[];
};

type Summary = {
  total: number;
  ok: number;
  warnings: number;
  errors: number;
  newWagons: number;
  updatedWagons: number;
};

type Preview = {
  batchId: string;
  summary: Summary;
  rows: Row[];
  unmappedHeaders: string[];
};

function StatusBadge({ status }: { status: Row["status"] }) {
  const map = {
    OK: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    WARNING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    ERROR: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  } as const;
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${map[status]}`}>{status}</span>;
}

export function ImportForm({
  stations,
}: {
  stations: { code: string; name: string }[];
}) {
  const t = useTranslations("import");
  const tw = useTranslations("wagons");
  const tc = useTranslations("common");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [sourceStation, setSourceStation] = useState("");
  const [reportDate, setReportDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  function handleFile(f?: File | null) {
    if (!f) return;
    if (!/\.xlsx?$/i.test(f.name)) {
      toast.error("Faqat .xlsx / .xls fayllar");
      return;
    }
    setFile(f);
    setPreview(null);
  }

  async function handleParse() {
    if (!file) return toast.error(t("noFile"));
    if (!reportDate) return toast.error(t("selectStationFirst"));
    setParsing(true);
    setPreview(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("sourceStation", sourceStation);
      fd.append("reportDate", reportDate);
      const res = await fetch("/api/import/preview", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xato");
      setPreview(data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setParsing(false);
    }
  }

  async function handleCommit() {
    if (!preview) return;
    setCommitting(true);
    try {
      const res = await fetch("/api/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: preview.batchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xato");
      toast.success(`${t("success")} (${data.inserted})`);
      setPreview(null);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      router.push("/wagons");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCommitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sourceStation">{t("sourceStation")}</Label>
              <Input
                id="sourceStation"
                list="stations-list"
                value={sourceStation}
                onChange={(e) => setSourceStation(e.target.value)}
                placeholder="—"
              />
              <datalist id="stations-list">
                {stations.map((s) => (
                  <option key={s.code} value={s.name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportDate">{t("reportDate")}</Label>
              <Input
                id="reportDate"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
          </div>

          {/* Drag & drop zona */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
              dragActive
                ? "border-primary bg-primary/5"
                : "border-input hover:bg-muted/50",
            )}
          >
            {file ? (
              <>
                <FileSpreadsheet className="text-primary size-8" />
                <div className="text-sm font-medium">{file.name}</div>
                <div className="text-muted-foreground text-xs">
                  {(file.size / 1024).toFixed(0)} KB
                </div>
              </>
            ) : (
              <>
                <Upload className="text-muted-foreground size-8" />
                <div className="text-sm font-medium">{t("selectFile")}</div>
                <div className="text-muted-foreground text-xs">{t("dropHint")}</div>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          <Button onClick={handleParse} disabled={parsing || !file}>
            {parsing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {t("parse")}
          </Button>
        </CardContent>
      </Card>

      {preview && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            <Stat label={t("rows")} value={preview.summary.total} />
            <Stat label={t("newWagons")} value={preview.summary.newWagons} tone="text-emerald-600" />
            <Stat label={t("updated")} value={preview.summary.updatedWagons} tone="text-blue-600" />
            <Stat label="OK" value={preview.summary.ok} tone="text-emerald-600" />
            <Stat label={t("warnings")} value={preview.summary.warnings} tone="text-amber-600" />
            <Stat label={t("errors")} value={preview.summary.errors} tone="text-red-600" />
          </div>

          {preview.unmappedHeaders.length > 0 && (
            <p className="text-muted-foreground text-xs">
              ⚠ {preview.unmappedHeaders.length} ustun moslanmadi:{" "}
              {preview.unmappedHeaders.join(", ")}
            </p>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t("preview")}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPreview(null)} disabled={committing}>
                  {tc("cancel")}
                </Button>
                <Button onClick={handleCommit} disabled={committing}>
                  {committing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  {t("commit")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[480px] overflow-auto rounded-md border">
                <Table>
                  <TableHeader className="bg-muted sticky top-0">
                    <TableRow>
                      <TableHead className="w-12">{t("rowNumber")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{tw("number")}</TableHead>
                      <TableHead>{tw("administration")}</TableHead>
                      <TableHead>{tw("factStation")}</TableHead>
                      <TableHead>{tw("station5065")}</TableHead>
                      <TableHead>{tw("discrepant")}</TableHead>
                      <TableHead>{t("messages")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.rows.map((r) => (
                      <TableRow
                        key={r.rowNumber}
                        className={r.status === "ERROR" ? "bg-red-50 dark:bg-red-950/30" : ""}
                      >
                        <TableCell className="text-muted-foreground">{r.rowNumber}</TableCell>
                        <TableCell><StatusBadge status={r.status} /></TableCell>
                        <TableCell className="font-mono">{r.parsed.wagonNumber ?? "—"}</TableCell>
                        <TableCell>
                          {r.parsed.administrationName || r.parsed.administrationCode || "—"}
                        </TableCell>
                        <TableCell>{r.parsed.factStation ?? "—"}</TableCell>
                        <TableCell>{r.parsed.station5065 ?? "—"}</TableCell>
                        <TableCell>
                          {r.parsed.isDiscrepant ? (
                            <Badge variant="destructive">!</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[280px] text-xs">
                          {r.messages.join("; ")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
