"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function GlobalWagonSearch({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("wagons");
  const router = useRouter();
  const [q, setQ] = useState("");

  function go() {
    const v = q.trim();
    if (!v) return;
    router.push(`/wagons?q=${encodeURIComponent(v)}`);
    onNavigate?.();
  }

  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
        placeholder={t("searchPlaceholder")}
        inputMode="numeric"
        className="pl-8"
      />
    </div>
  );
}
