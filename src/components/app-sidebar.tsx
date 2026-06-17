"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Upload,
  Train,
  MapPin,
  History,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalWagonSearch } from "@/components/global-wagon-search";
import { logoutAction } from "@/lib/actions/auth";
import { can, ROLE_LABELS, type Role } from "@/lib/auth/permissions";

type Perm = keyof ReturnType<typeof can>;

const NAV: { href: string; key: string; icon: typeof Train; perm?: Perm }[] = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/import", key: "import", icon: Upload, perm: "upload" },
  { href: "/wagons", key: "wagons", icon: Train },
  { href: "/stations", key: "stations", icon: MapPin },
  { href: "/history", key: "history", icon: History, perm: "upload" },
  { href: "/users", key: "users", icon: Users, perm: "manageUsers" },
];

type SidebarUser = { fullName: string; login: string; role: Role };

function NavLinks({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const perms = can(role);

  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.filter((n) => !n.perm || perms[n.perm]).map(({ href, key, icon: Icon }) => {
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

function UserFooter({ user }: { user: SidebarUser }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [out, setOut] = useState(false);

  async function logout() {
    setOut(true);
    await logoutAction();
    router.push("/login");
    router.refresh();
  }

  const roleLabel = ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role;

  return (
    <div className="space-y-2 border-t p-3">
      <div className="flex items-center gap-2">
        <div className="bg-muted text-foreground flex size-8 items-center justify-center rounded-full text-xs font-semibold uppercase">
          {user.fullName.slice(0, 2)}
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-medium">{user.fullName}</div>
          <div className="text-muted-foreground text-xs">{roleLabel}</div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
      <Button variant="outline" size="sm" className="w-full" onClick={logout} disabled={out}>
        <LogOut className="size-4" />
        {t("logout")}
      </Button>
    </div>
  );
}

export function AppSidebar({ user }: { user: SidebarUser }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className="bg-card hidden w-64 shrink-0 flex-col border-r md:flex">
        <Brand />
        <div className="p-3">
          <GlobalWagonSearch />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks role={user.role} />
        </div>
        <UserFooter user={user} />
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
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
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
              <NavLinks role={user.role} onNavigate={() => setOpen(false)} />
            </div>
            <UserFooter user={user} />
          </aside>
        </div>
      )}
    </>
  );
}
