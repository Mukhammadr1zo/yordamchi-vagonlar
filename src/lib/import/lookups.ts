import { prisma } from "@/lib/prisma";
import { norm } from "./parse";
import type { Lookups } from "./process";

export async function buildLookups(): Promise<Lookups> {
  const [admins, stations] = await Promise.all([
    prisma.administration.findMany({
      select: { id: true, code: true, nameUz: true, nameRu: true },
    }),
    prisma.station.findMany({
      select: { id: true, code: true, nameUz: true, nameRu: true },
    }),
  ]);

  const adminByCode = new Map<string, string>();
  const adminByName = new Map<string, string>();
  for (const a of admins) {
    adminByCode.set(a.code, a.id);
    adminByName.set(norm(a.nameUz), a.id);
    adminByName.set(norm(a.nameRu), a.id);
  }

  const stationByCode = new Map<string, string>();
  const stationByName = new Map<string, string>();
  for (const s of stations) {
    stationByCode.set(s.code, s.id);
    stationByName.set(norm(s.nameUz), s.id);
    stationByName.set(norm(s.nameRu), s.id);
  }

  return { adminByCode, adminByName, stationByCode, stationByName };
}
