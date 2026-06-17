"use client";

import { useTransition, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TriangleAlert, FileWarning } from "lucide-react";

export function WagonFilters() {
  const t = useTranslations("wagons");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(sp.get("q") ?? "");
  const disc = sp.get("disc") === "1";
  const undoc = sp.get("undoc") === "1";

  function apply(next: URLSearchParams) {
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  // qidiruvni debounce qilish
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

  function toggle(key: "disc" | "undoc") {
    const next = new URLSearchParams(sp.toString());
    if (next.get(key) === "1") next.delete(key);
    else next.set(key, "1");
    apply(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative max-w-xs flex-1">
        <Search className="text-muted-foreground absolute left-2.5 top-2.5 size-4" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`${tc("search")}… (${t("number")})`}
          className="pl-8"
        />
      </div>
      <Button
        variant={disc ? "default" : "outline"}
        size="sm"
        onClick={() => toggle("disc")}
      >
        <TriangleAlert className="size-4" />
        {t("discrepant")}
      </Button>
      <Button
        variant={undoc ? "default" : "outline"}
        size="sm"
        onClick={() => toggle("undoc")}
      >
        <FileWarning className="size-4" />
        {tc("filter")}: без док.
      </Button>
    </div>
  );
}
