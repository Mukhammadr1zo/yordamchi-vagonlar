"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const pad = (n: number) => String(n).padStart(2, "0");

export function DayPicker() {
  const t = useTranslations("wagons");
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const dateStr = sp.get("date") ?? "";
  const selected = dateStr
    ? (() => {
        const [y, m, d] = dateStr.split("-").map(Number);
        return new Date(y, m - 1, d);
      })()
    : undefined;

  function pick(day?: Date) {
    if (!day) return;
    const iso = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
    const next = new URLSearchParams(sp.toString());
    next.set("date", iso);
    router.replace(`${pathname}?${next.toString()}`);
    setOpen(false);
  }

  function clear() {
    const next = new URLSearchParams(sp.toString());
    next.delete("date");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button variant={dateStr ? "default" : "outline"} size="sm">
              <CalendarDays className="size-4" />
              {dateStr || t("pickDay")}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={selected} onSelect={pick} autoFocus />
        </PopoverContent>
      </Popover>
      {dateStr && (
        <Button variant="ghost" size="icon-sm" onClick={clear} aria-label="clear">
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
