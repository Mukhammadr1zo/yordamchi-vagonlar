"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Search, TriangleAlert, FileWarning } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const selectCls =
  "border-input bg-transparent dark:bg-input/30 h-9 rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function StationFilters({
  admins,
  types,
}: {
  admins: { code: string; name: string }[];
  types: string[];
}) {
  const t = useTranslations("stations");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, start] = useTransition();

  const [q, setQ] = useState(sp.get("q") ?? "");
  const admin = sp.get("admin") ?? "";
  const type = sp.get("type") ?? "";
  const disc = sp.get("disc") === "1";
  const undoc = sp.get("undoc") === "1";

  function apply(next: URLSearchParams) {
    const qs = next.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  }
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    apply(next);
  }
  function toggle(key: string) {
    const next = new URLSearchParams(sp.toString());
    if (next.get(key) === "1") next.delete(key);
    else next.set(key, "1");
    apply(next);
  }

  useEffect(() => {
    const id = setTimeout(() => {
      const next = new URLSearchParams(sp.toString());
      if (q) next.set("q", q);
      else next.delete("q");
      if (next.toString() !== sp.toString()) apply(next);
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[180px] flex-1">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`${tc("search")}… (${t("station")})`}
          className="pl-8"
        />
      </div>

      <select className={selectCls} value={admin} onChange={(e) => setParam("admin", e.target.value)}>
        <option value="">{t("allAdmins")}</option>
        {admins.map((a) => (
          <option key={a.code} value={a.code}>
            {a.name}
          </option>
        ))}
      </select>

      <select className={selectCls} value={type} onChange={(e) => setParam("type", e.target.value)}>
        <option value="">{t("allTypes")}</option>
        {types.map((ty) => (
          <option key={ty} value={ty}>
            {ty}
          </option>
        ))}
      </select>

      <Button variant={disc ? "default" : "outline"} size="sm" onClick={() => toggle("disc")}>
        <TriangleAlert className="size-4" />
        {t("discrepant")}
      </Button>
      <Button variant={undoc ? "default" : "outline"} size="sm" onClick={() => toggle("undoc")}>
        <FileWarning className="size-4" />
        {t("undocumented")}
      </Button>
    </div>
  );
}
