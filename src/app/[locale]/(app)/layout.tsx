import { setRequestLocale } from "next-intl/server";
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

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <AppSidebar />
      <main className="bg-muted/30 flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
