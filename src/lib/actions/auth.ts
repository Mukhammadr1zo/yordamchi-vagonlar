"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth/session";
import type { Role } from "@/lib/auth/permissions";

type Result = { ok: true } | { ok: false; error: string };

export async function loginAction(input: { login: string; password: string }): Promise<Result> {
  const login = input.login?.trim();
  const password = input.password ?? "";
  if (!login || !password) return { ok: false, error: "Login va parol kiriting" };

  const user = await prisma.user.findUnique({ where: { login } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, error: "Login yoki parol noto'g'ri" };
  }
  if (!user.isActive) return { ok: false, error: "Hisob faol emas" };

  const token = await signSession({
    sub: user.id,
    login: user.login,
    name: user.fullName,
    role: user.role as Role,
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
