import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySession } from "./session";
import type { Role } from "./permissions";

export interface CurrentUser {
  id: string;
  login: string;
  fullName: string;
  role: Role;
}

/** Joriy foydalanuvchi (cookie -> JWT -> DB tekshiruvi). DB'da yo'q/faol emas bo'lsa null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, login: true, fullName: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) return null;

  return { id: user.id, login: user.login, fullName: user.fullName, role: user.role as Role };
}
