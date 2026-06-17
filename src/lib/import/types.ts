export type FieldKey =
  | "factStation"
  | "wagonNumber"
  | "administrationCode"
  | "administrationName"
  | "loadingDocStatus"
  | "loadingStation"
  | "loadingDate"
  | "trainIndex"
  | "destinationStation"
  | "unloadingDate"
  | "unloadingDocStatus"
  | "station5065"
  | "reportedLoadCount";

export type DocStatus = "SMGS" | "NO_DOC" | "UNKNOWN";
export type RowStatusKind = "OK" | "WARNING" | "ERROR";

export interface RawRow {
  rowNumber: number;
  cells: Partial<Record<FieldKey, string | number | Date | null>>;
  rawAll: Record<string, string>; // barcha ustunlar (sarlavha matni -> qiymat)
}

export interface ParsedRow {
  wagonNumber: string | null;
  administrationCode: string | null;
  administrationName: string | null;
  factStation: string | null;
  station5065: string | null;
  loadingStation: string | null;
  destinationStation: string | null;
  loadingDate: string | null; // ISO yyyy-mm-dd
  unloadingDate: string | null;
  loadingDocStatus: DocStatus;
  unloadingDocStatus: DocStatus;
  trainIndex: string | null;
  reportedLoadCount: number | null;
  isDiscrepant: boolean;
  raw?: Record<string, string>; // Excel qatorining barcha ustunlari
}

export interface ValidatedRow {
  rowNumber: number;
  parsed: ParsedRow;
  status: RowStatusKind;
  messages: string[];
}

export interface PreviewSummary {
  total: number;
  ok: number;
  warnings: number;
  errors: number;
  newWagons: number;
  updatedWagons: number;
}
