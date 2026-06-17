import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AppSidebar } from "@/components/app-sidebar";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <AppSidebar
        user={{ fullName: user.fullName, login: user.login, role: user.role }}
      />
      <main className="bg-muted/30 flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
