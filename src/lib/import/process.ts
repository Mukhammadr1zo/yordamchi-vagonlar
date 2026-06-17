import {
  cleanWagonNumber,
  isValidWagonNumber,
  norm,
  parseDate,
  parseDocStatus,
} from "./parse";
import type { ParsedRow, RawRow, RowStatusKind, ValidatedRow } from "./types";

export interface Lookups {
  adminByCode: Map<string, string>; // code -> id
  adminByName: Map<string, string>; // norm(name) -> id
  stationByCode: Map<string, string>;
  stationByName: Map<string, string>;
}

export function resolveAdminId(
  lk: Lookups,
  code: string | null,
  name: string | null,
): string | null {
  if (code && lk.adminByCode.has(code)) return lk.adminByCode.get(code)!;
  if (name && lk.adminByName.has(norm(name))) return lk.adminByName.get(norm(name))!;
  return null;
}

export function resolveStationId(lk: Lookups, value: string | null): string | null {
  if (!value) return null;
  const n = norm(value);
  if (lk.stationByCode.has(value)) return lk.stationByCode.get(value)!;
  if (lk.stationByName.has(n)) return lk.stationByName.get(n)!;
  return null;
}

function cellStr(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

export function parseRow(raw: RawRow): ParsedRow {
  const c = raw.cells;
  const factStation = cellStr(c.factStation);
  const station5065 = cellStr(c.station5065);
  return {
    wagonNumber: cleanWagonNumber(c.wagonNumber),
    administrationCode: cellStr(c.administrationCode),
    administrationName: cellStr(c.administrationName),
    factStation,
    station5065,
    loadingStation: cellStr(c.loadingStation),
    destinationStation: cellStr(c.destinationStation),
    loadingDate: parseDate(c.loadingDate),
    unloadingDate: parseDate(c.unloadingDate),
    loadingDocStatus: parseDocStatus(c.loadingDocStatus),
    unloadingDocStatus: parseDocStatus(c.unloadingDocStatus),
    trainIndex: cellStr(c.trainIndex),
    reportedLoadCount:
      c.reportedLoadCount != null && String(c.reportedLoadCount).trim() !== ""
        ? Number(String(c.reportedLoadCount).replace(/\D/g, "")) || null
        : null,
    isDiscrepant:
      !!factStation && !!station5065 && norm(factStation) !== norm(station5065),
    raw: raw.rawAll,
  };
}

export function validateRow(raw: RawRow, lk: Lookups): ValidatedRow {
  const parsed = parseRow(raw);
  const messages: string[] = [];
  let status: RowStatusKind = "OK";
  const warn = (m: string) => {
    messages.push(m);
    if (status === "OK") status = "WARNING";
  };
  const err = (m: string) => {
    messages.push(m);
    status = "ERROR";
  };

  // Vagon raqami (kalit)
  if (!parsed.wagonNumber) {
    err("Vagon raqami yo'q");
  } else if (parsed.wagonNumber.length !== 8) {
    warn(`Vagon raqami 8 xonali emas (${parsed.wagonNumber.length})`);
  } else if (!isValidWagonNumber(parsed.wagonNumber)) {
    warn("Nazorat raqami noto'g'ri (контрольная цифра)");
  }

  // Administratsiya
  if (!parsed.administrationCode && !parsed.administrationName) {
    warn("Davlat/собственник ko'rsatilmagan");
  } else if (resolveAdminId(lk, parsed.administrationCode, parsed.administrationName) === null) {
    warn(
      `Administratsiya topilmadi (${parsed.administrationCode ?? ""} ${parsed.administrationName ?? ""})`.trim(),
    );
  }

  // Stansiyalar — topilmaganlarini yig'amiz
  const stationFields: [string, string | null][] = [
    ["факт", parsed.factStation],
    ["5065", parsed.station5065],
    ["погрузка", parsed.loadingStation],
    ["назначение", parsed.destinationStation],
  ];
  const unknownStations = stationFields
    .filter(([, v]) => v && resolveStationId(lk, v) === null)
    .map(([label, v]) => `${label}: ${v}`);
  if (unknownStations.length) {
    warn(`Stansiya topilmadi → ${unknownStations.join("; ")}`);
  }

  // Sanalar
  if (parsed.loadingDate && parsed.unloadingDate && parsed.loadingDate > parsed.unloadingDate) {
    warn("Yuklash sanasi bo'shatishdan keyin");
  }

  // Hujjatsiz harakat — belgilash (xato emas, ma'lumot)
  if (parsed.loadingDocStatus === "NO_DOC" || parsed.unloadingDocStatus === "NO_DOC") {
    messages.push("Hujjatsiz harakat (без документа)");
  }

  return { rowNumber: raw.rowNumber, parsed, status, messages };
}

export function validateRows(rows: RawRow[], lk: Lookups): ValidatedRow[] {
  return rows.map((r) => validateRow(r, lk));
}
