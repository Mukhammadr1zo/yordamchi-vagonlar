"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import type { ActionResult } from "@/lib/wagon/types";

const ROLES = ["SUPERADMIN", "ADMIN", "RAHBAR"] as const;
type ManageRole = (typeof ROLES)[number];

export interface UserInput {
  fullName: string;
  login: string;
  role: ManageRole;
  password?: string;
  isActive?: boolean;
}

async function guard(): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user || !can(user.role).manageUsers) {
    return { ok: false, error: "Foydalanuvchi boshqaruvi uchun ruxsatingiz yo'q" };
  }
  return { ok: true, userId: user.id };
}

function revalidate() {
  for (const l of ["uz", "ru"]) revalidatePath(`/${l}/users`);
}

export async function createUserAction(input: UserInput): Promise<ActionResult> {
  try {
    const g = await guard();
    if (!g.ok) return g;

    const fullName = input.fullName?.trim();
    const login = input.login?.trim();
    const password = input.password ?? "";
    if (!fullName || !login) return { ok: false, error: "Ism va login kiriting" };
    if (password.length < 5) return { ok: false, error: "Parol kamida 5 ta belgi bo'lsin" };
    if (!ROLES.includes(input.role)) return { ok: false, error: "Rol noto'g'ri" };

    const exists = await prisma.user.findUnique({ where: { login } });
    if (exists) return { ok: false, error: "Bu login band" };

    await prisma.user.create({
      data: { fullName, login, role: input.role, passwordHash: await hashPassword(password) },
    });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateUserAction(id: string, input: UserInput): Promise<ActionResult> {
  try {
    const g = await guard();
    if (!g.ok) return g;

    const fullName = input.fullName?.trim();
    if (!fullName) return { ok: false, error: "Ism kiriting" };
    if (!ROLES.includes(input.role)) return { ok: false, error: "Rol noto'g'ri" };

    // O'zini bloklamaslik / rolini tushirmaslik (lockout oldini olish)
    if (id === g.userId && (input.role !== "SUPERADMIN" || input.isActive === false)) {
      return { ok: false, error: "O'zingizning rol/holatingizni o'zgartira olmaysiz" };
    }

    const data: {
      fullName: string;
      role: ManageRole;
      isActive: boolean;
      passwordHash?: string;
    } = {
      fullName,
      role: input.role,
      isActive: input.isActive ?? true,
    };
    if (input.password && input.password.length >= 5) {
      data.passwordHash = await hashPassword(input.password);
    }

    await prisma.user.update({ where: { id }, data });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  try {
    const g = await guard();
    if (!g.ok) return g;
    if (id === g.userId) return { ok: false, error: "O'zingizni o'chira olmaysiz" };

    await prisma.user.delete({ where: { id } });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
