import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { UsersManager } from "@/components/users/users-manager";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentUser();
  if (!can(me?.role).manageUsers) redirect({ href: "/dashboard", locale });

  const t = await getTranslations("users");
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, fullName: true, login: true, role: true, isActive: true, lastLogin: true },
  });
  const rows = users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    login: u.login,
    role: u.role,
    isActive: u.isActive,
    lastLogin: u.lastLogin ? u.lastLogin.toISOString().slice(0, 16).replace("T", " ") : null,
  }));

  return (
    <div className="space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <UsersManager users={rows} />
    </div>
  );
}
