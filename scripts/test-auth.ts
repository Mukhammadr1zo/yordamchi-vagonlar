import fs from "fs";
import { SignJWT } from "jose";

const envText = fs.readFileSync(".env", "utf8");
const get = (k: string) => envText.match(new RegExp(`^${k}="?([^"\\n\\r]+)`, "m"))?.[1];
process.env.DATABASE_URL = process.env.DATABASE_URL || get("DATABASE_URL")!;
const AUTH_SECRET = get("AUTH_SECRET") || "dev-secret-change-me-32chars-min";

const PORT = process.env.TEST_PORT || "3000";
const BASE = `http://localhost:${PORT}`;

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const su = await prisma.user.findUnique({ where: { login: "superadmin" } });
  if (!su) throw new Error("superadmin topilmadi");

  const token = await new SignJWT({ login: su.login, name: su.fullName, role: su.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(su.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(AUTH_SECRET));
  const cookie = `vagon_session=${token}`;

  const r1 = await fetch(`${BASE}/uz/dashboard`, { redirect: "manual" });
  console.log(`no-cookie /uz/dashboard  -> ${r1.status} ${r1.headers.get("location") ?? ""}`);

  const r2 = await fetch(`${BASE}/uz/dashboard`, { headers: { cookie }, redirect: "manual" });
  console.log(`cookie    /uz/dashboard  -> ${r2.status}`);

  const r3 = await fetch(`${BASE}/uz/users`, { headers: { cookie }, redirect: "manual" });
  console.log(`cookie    /uz/users      -> ${r3.status}`);

  const r4 = await fetch(`${BASE}/uz/login`, { redirect: "manual" });
  console.log(`no-cookie /uz/login      -> ${r4.status}`);

  await prisma.$disconnect();
}
main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
