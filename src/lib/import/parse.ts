import ExcelJS from "exceljs";
import type { DocStatus, FieldKey, RawRow } from "./types";

export function norm(s: unknown): string {
  return String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** exceljs hujayrasidan matn (rich text / formula / hyperlink ham) */
export function cellText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v).trim();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.text === "string") return o.text.trim();
    if (typeof o.result !== "undefined") return String(o.result).trim();
    if (Array.isArray(o.richText))
      return (o.richText as { text: string }[]).map((r) => r.text).join("").trim();
    if (o.hyperlink && typeof o.text === "string") return o.text;
  }
  return String(v).trim();
}

/** Sarlavha matnini FieldKey ga moslovchi qoidalar (eng aniqlari birinchi) */
const MATCHERS: { key: FieldKey; test: (h: string) => boolean }[] = [
  { key: "loadingDocStatus", test: (h) => h.includes("прибыт") && h.includes("погруз") },
  { key: "unloadingDocStatus", test: (h) => h.includes("прибыт") && h.includes("выгруз") },
  { key: "wagonNumber", test: (h) => h.includes("номер") && h.includes("вагон") },
  { key: "administrationCode", test: (h) => h.includes("код") && h.includes("вагон") },
  { key: "administrationName", test: (h) => h.includes("собственник") },
  { key: "loadingDate", test: (h) => h.includes("дата") && h.includes("погруз") },
  { key: "unloadingDate", test: (h) => h.includes("дата") && h.includes("выгруз") },
  { key: "loadingStation", test: (h) => h.includes("станц") && h.includes("погруз") },
  { key: "destinationStation", test: (h) => h.includes("назначени") },
  { key: "station5065", test: (h) => h.includes("5065") },
  { key: "factStation", test: (h) => h.includes("факт") },
  { key: "trainIndex", test: (h) => h.includes("индекс") },
  { key: "reportedLoadCount", test: (h) => h.includes("сколько") || h.includes("погрузил") },
];

export function mapHeaderToField(header: string): FieldKey | null {
  const h = norm(header);
  if (!h) return null;
  for (const m of MATCHERS) if (m.test(h)) return m.key;
  return null;
}

export function parseDocStatus(v: unknown): DocStatus {
  const s = norm(v);
  if (!s) return "UNKNOWN";
  if (s.includes("смгс")) return "SMGS";
  if (s.includes("без")) return "NO_DOC";
  return "UNKNOWN";
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseDate(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : isoDate(v);
  if (typeof v === "number") {
    // Excel serial (1899-12-30 bazasi)
    const ms = Date.UTC(1899, 11, 30) + Math.round(v) * 86400000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : isoDate(d);
  }
  const s = String(v).trim();
  if (!s) return null;
  let m = s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);
  if (m) {
    let year = +m[3];
    if (year < 100) year += 2000;
    const d = new Date(Date.UTC(year, +m[2] - 1, +m[1]));
    return isNaN(d.getTime()) ? null : isoDate(d);
  }
  m = s.match(/^(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})$/);
  if (m) {
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return isNaN(d.getTime()) ? null : isoDate(d);
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : isoDate(d);
}

export function cleanWagonNumber(v: unknown): string | null {
  const digits = String(v ?? "").replace(/\D/g, "");
  return digits || null;
}

/**
 * MDH (1520) 8 xonali vagon raqami nazorat raqami (контрольная цифра).
 * Birinchi 7 raqamga 2,1,2,1,2,1,2 vaznlari qo'llanadi, ko'paytma raqamlari
 * yig'iladi, nazorat raqami yig'indini 10 ga karralisiga to'ldiradi.
 */
export function wagonCheckDigit(first7: string): number | null {
  if (!/^\d{7}$/.test(first7)) return null;
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const p = Number(first7[i]) * (i % 2 === 0 ? 2 : 1);
    sum += p >= 10 ? Math.floor(p / 10) + (p % 10) : p;
  }
  return (10 - (sum % 10)) % 10;
}

/** 8 xonali raqam nazorat raqami bo'yicha to'g'rimi */
export function isValidWagonNumber(num: string): boolean {
  if (!/^\d{8}$/.test(num)) return false;
  return wagonCheckDigit(num.slice(0, 7)) === Number(num[7]);
}

export interface ParseResult {
  rows: RawRow[];
  columnMap: Partial<Record<FieldKey, number>>;
  headerRow: number;
  unmappedHeaders: string[];
}

/** Workbook'ni o'qib, sarlavha qatorini topadi va xom qatorlarni qaytaradi */
export async function parseWorkbook(buffer: Buffer): Promise<ParseResult> {
  const wb = new ExcelJS.Workbook();
  // Node 20 Buffer generic vs exceljs tip mosligi uchun cast
  await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("Excel'da varaq topilmadi");

  // Sarlavha qatorini topish: dastlabki 12 qatordan "вагон" bo'lganini izlash
  let headerRow = -1;
  const maxScan = Math.min(12, ws.actualRowCount || ws.rowCount || 12);
  for (let r = 1; r <= maxScan; r++) {
    const row = ws.getRow(r);
    const texts: string[] = [];
    row.eachCell({ includeEmpty: true }, (c) => texts.push(norm(cellText(c.value))));
    const joined = texts.join(" ");
    if (joined.includes("вагон") && (joined.includes("станц") || joined.includes("факт"))) {
      headerRow = r;
      break;
    }
  }
  if (headerRow === -1) throw new Error("Sarlavha qatori topilmadi (вагон/станция)");

  // Ustunlarni moslovchilash + barcha sarlavha matnlarini saqlash
  const columnMap: Partial<Record<FieldKey, number>> = {};
  const unmappedHeaders: string[] = [];
  const headerTexts = new Map<number, string>();
  const hRow = ws.getRow(headerRow);
  hRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const text = cellText(cell.value);
    if (text) headerTexts.set(colNumber, text);
    const key = mapHeaderToField(text);
    if (key && columnMap[key] === undefined) {
      columnMap[key] = colNumber;
    } else if (text) {
      unmappedHeaders.push(text);
    }
  });

  // Ma'lumot qatorlari
  const rows: RawRow[] = [];
  const lastRow = ws.actualRowCount || ws.rowCount;
  for (let r = headerRow + 1; r <= lastRow; r++) {
    const row = ws.getRow(r);
    const cells: RawRow["cells"] = {};
    const rawAll: Record<string, string> = {};
    let hasData = false;
    for (const [key, col] of Object.entries(columnMap) as [FieldKey, number][]) {
      const raw = row.getCell(col).value;
      const txt = cellText(raw);
      if (txt) hasData = true;
      // sana/raqam uchun xom qiymatni saqlaymiz
      cells[key] =
        raw instanceof Date
          ? raw
          : typeof raw === "number"
            ? raw
            : txt || null;
    }
    // Barcha ustunlarni (moslangan + moslanmagan) xom holda saqlash
    for (const [col, header] of headerTexts) {
      const txt = cellText(row.getCell(col).value);
      if (txt) {
        rawAll[header] = txt;
        hasData = true;
      }
    }
    if (hasData) rows.push({ rowNumber: r, cells, rawAll });
  }

  return { rows, columnMap, headerRow, unmappedHeaders };
}
