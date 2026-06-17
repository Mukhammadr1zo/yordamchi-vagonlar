import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./permissions";

// jose — edge (middleware) va Node'da ishlaydi. Prisma/bcrypt importi YO'Q (edge-safe).
export const SESSION_COOKIE = "vagon_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 kun (soniya)

const key = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me-32chars-min");

export interface SessionPayload {
  sub: string; // userId
  login: string;
  name: string;
  role: Role;
}

export async function signSession(p: SessionPayload): Promise<string> {
  return new SignJWT({ login: p.login, name: p.name, role: p.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key());
    return {
      sub: String(payload.sub),
      login: String(payload.login ?? ""),
      name: String(payload.name ?? ""),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}
