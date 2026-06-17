import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE, verifySession } from "./lib/auth/session";

const intl = createMiddleware(routing);
const locales = routing.locales as readonly string[];

// Locale'dan keyingi ochiq (auth talab qilmaydigan) yo'llar
const PUBLIC = ["/login"];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const parts = pathname.split("/");
  const hasLocale = locales.includes(parts[1]);
  const locale = hasLocale ? parts[1] : routing.defaultLocale;
  const rest = hasLocale ? "/" + parts.slice(2).join("/") : pathname;

  const isPublic = PUBLIC.some((p) => rest === p || rest.startsWith(p + "/"));

  if (!isPublic) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const valid = token ? await verifySession(token) : null;
    if (!valid) {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return intl(req);
}

export const config = {
  // api, _next, statik fayllardan tashqari barcha yo'llar
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
