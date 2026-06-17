"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createRecordAction, updateRecordAction } from "@/lib/actions/wagon";
import type { RecordInput } from "@/lib/wagon/types";

type Opt = { code: string; name: string };

const DOC = ["UNKNOWN", "SMGS", "NO_DOC"] as const;

const selectCls =
  "border-input bg-transparent dark:bg-input/30 h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function WagonRecordForm({
  administrations,
  stations,
  mode,
  recordId,
  initial,
  lockNumber,
}: {
  administrations: Opt[];
  stations: Opt[];
  mode: "create" | "edit";
  recordId?: string;
  initial?: Partial<RecordInput>;
  lockNumber?: boolean;
}) {
  const t = useTranslations("wagons");
  const tf = useTranslations("form");
  const ti = useTranslations("import");
  const td = useTranslations("docStatus");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const [f, setF] = useState<RecordInput>({
    wagonNumber: initial?.wagonNumber ?? "",
    wagonType: initial?.wagonType ?? "",
    administrationCode: initial?.administrationCode ?? "",
    administrationName: initial?.administrationName ?? "",
    reportDate: initial?.reportDate ?? new Date().toISOString().slice(0, 10),
    sourceStation: initial?.sourceStation ?? "",
    factStation: initial?.factStation ?? "",
    station5065: initial?.station5065 ?? "",
    loadingStation: initial?.loadingStation ?? "",
    loadingDate: initial?.loadingDate ?? "",
    loadingDocStatus: initial?.loadingDocStatus ?? "UNKNOWN",
    trainIndex: initial?.trainIndex ?? "",
    destinationStation: initial?.destinationStation ?? "",
    unloadingDate: initial?.unloadingDate ?? "",
    unloadingDocStatus: initial?.unloadingDocStatus ?? "UNKNOWN",
    reportedLoadCount: initial?.reportedLoadCount ?? null,
  });

  const set = (k: keyof RecordInput, v: string | number | null) =>
    setF((prev) => ({ ...prev, [k]: v }));

  async function submit() {
    if (!f.wagonNumber.trim()) return toast.error(t("number") + "?");
    setPending(true);
    try {
      const res =
        mode === "edit" && recordId
          ? await updateRecordAction(recordId, f)
          : await createRecordAction(f);
      if (!res.ok) throw new Error(res.error);
      toast.success(tc("save") + " ✓");
      router.push(res.wagonId ? `/wagons/${res.wagonId}` : "/wagons");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <datalist id="st-list">
          {stations.map((s) => (
            <option key={s.code} value={s.name} />
          ))}
        </datalist>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Vagon raqami */}
          <div className="space-y-2">
            <Label>{t("number")} *</Label>
            <Input
              value={f.wagonNumber}
              onChange={(e) => set("wagonNumber", e.target.value)}
              placeholder="8 xona"
              maxLength={8}
              inputMode="numeric"
              disabled={lockNumber}
              className="font-mono"
            />
          </div>

          {/* Administratsiya */}
          <div className="space-y-2">
            <Label>{t("administration")}</Label>
            <select
              className={selectCls}
              value={f.administrationCode ?? ""}
              onChange={(e) => {
                const code = e.target.value;
                const name = administrations.find((a) => a.code === code)?.name ?? "";
                setF((p) => ({ ...p, administrationCode: code, administrationName: name }));
              }}
            >
              <option value="">—</option>
              {administrations.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vagon turi (qo'lda) */}
          <div className="space-y-2">
            <Label>{tf("wagonType")}</Label>
            <Input
              list="wt-list"
              value={f.wagonType ?? ""}
              onChange={(e) => set("wagonType", e.target.value)}
              placeholder="Крытый, Цистерна..."
            />
            <datalist id="wt-list">
              {["Крытый", "Полувагон", "Цистерна", "Платформа", "Рефрижератор", "Хоппер", "Фитинговая платформа", "Думпкар", "Зерновоз", "Цементовоз"].map(
                (k) => (
                  <option key={k} value={k} />
                ),
              )}
            </datalist>
          </div>

          {/* Hisobot sanasi */}
          <div className="space-y-2">
            <Label>{ti("reportDate")} *</Label>
            <Input
              type="date"
              value={f.reportDate}
              onChange={(e) => set("reportDate", e.target.value)}
            />
          </div>

          {/* Fakt stansiya */}
          <div className="space-y-2">
            <Label>{t("factStation")}</Label>
            <Input
              list="st-list"
              value={f.factStation ?? ""}
              onChange={(e) => set("factStation", e.target.value)}
            />
          </div>

          {/* 5065 stansiya */}
          <div className="space-y-2">
            <Label>{t("station5065")}</Label>
            <Input
              list="st-list"
              value={f.station5065 ?? ""}
              onChange={(e) => set("station5065", e.target.value)}
            />
          </div>

          {/* Manba stansiya */}
          <div className="space-y-2">
            <Label>{ti("sourceStation")}</Label>
            <Input
              list="st-list"
              value={f.sourceStation ?? ""}
              onChange={(e) => set("sourceStation", e.target.value)}
            />
          </div>

          {/* Yuklash stansiyasi */}
          <div className="space-y-2">
            <Label>{tf("loadingStation")}</Label>
            <Input
              list="st-list"
              value={f.loadingStation ?? ""}
              onChange={(e) => set("loadingStation", e.target.value)}
            />
          </div>

          {/* Yuklash sanasi */}
          <div className="space-y-2">
            <Label>{tf("loadingDate")}</Label>
            <Input
              type="date"
              value={f.loadingDate ?? ""}
              onChange={(e) => set("loadingDate", e.target.value)}
            />
          </div>

          {/* Yuklash hujjati */}
          <div className="space-y-2">
            <Label>{tf("loadingDoc")}</Label>
            <select
              className={selectCls}
              value={f.loadingDocStatus}
              onChange={(e) => set("loadingDocStatus", e.target.value)}
            >
              {DOC.map((d) => (
                <option key={d} value={d}>
                  {td(d)}
                </option>
              ))}
            </select>
          </div>

          {/* Manzil stansiyasi */}
          <div className="space-y-2">
            <Label>{tf("destinationStation")}</Label>
            <Input
              list="st-list"
              value={f.destinationStation ?? ""}
              onChange={(e) => set("destinationStation", e.target.value)}
            />
          </div>

          {/* Bo'shatish sanasi */}
          <div className="space-y-2">
            <Label>{tf("unloadingDate")}</Label>
            <Input
              type="date"
              value={f.unloadingDate ?? ""}
              onChange={(e) => set("unloadingDate", e.target.value)}
            />
          </div>

          {/* Bo'shatish hujjati */}
          <div className="space-y-2">
            <Label>{tf("unloadingDoc")}</Label>
            <select
              className={selectCls}
              value={f.unloadingDocStatus}
              onChange={(e) => set("unloadingDocStatus", e.target.value)}
            >
              {DOC.map((d) => (
                <option key={d} value={d}>
                  {td(d)}
                </option>
              ))}
            </select>
          </div>

          {/* Poezd indeksi */}
          <div className="space-y-2">
            <Label>{tf("trainIndex")}</Label>
            <Input
              value={f.trainIndex ?? ""}
              onChange={(e) => set("trainIndex", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {tc("save")}
          </Button>
          <Button variant="outline" onClick={() => router.back()} disabled={pending}>
            {tc("cancel")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
