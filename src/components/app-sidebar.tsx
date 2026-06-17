"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LayoutDashboard, Upload, Train, MapPin, History, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalWagonSearch } from "@/components/global-wagon-search";

const NAV = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/import", key: "import", icon: Upload },
  { href: "/wagons", key: "wagons", icon: Train },
  { href: "/stations", key: "stations", icon: MapPin },
  { href: "/history", key: "history", icon: History },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map(({ href, key, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  const t = useTranslations("app");
  return (
    <div className="border-b px-4 py-4">
      <div className="flex items-center gap-2.5">
        <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl shadow-sm">
          <Train className="size-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">{t("title")}</div>
          <div className="text-muted-foreground text-xs">{t("subtitle")}</div>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="bg-card hidden w-64 shrink-0 flex-col border-r md:flex">
        <Brand />
        <div className="p-3">
          <GlobalWagonSearch />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="flex items-center justify-between border-t p-3">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="bg-card flex items-center justify-between border-b px-4 py-3 md:hidden">
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
          <Menu className="size-5" />
        </Button>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LocaleSwitcher />
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="bg-card absolute inset-y-0 left-0 flex w-64 flex-col border-r shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-semibold">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
            <div className="p-3">
              <GlobalWagonSearch onNavigate={() => setOpen(false)} />
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
