"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: string) {
    router.replace(pathname, { locale: next });
  }

  return (
    <div className="flex items-center gap-1">
      <Languages className="text-muted-foreground size-4" />
      {routing.locales.map((l) => (
        <Button
          key={l}
          variant={l === locale ? "default" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs uppercase"
          onClick={() => switchTo(l)}
        >
          {l}
        </Button>
      ))}
    </div>
  );
}
