import type { DocStatus } from "@/lib/import/types";

export interface RecordInput {
  wagonNumber: string;
  wagonType?: string | null;
  administrationCode?: string | null;
  administrationName?: string | null;
  reportDate: string; // ISO yyyy-mm-dd
  sourceStation?: string | null;
  factStation?: string | null;
  station5065?: string | null;
  loadingStation?: string | null;
  loadingDate?: string | null;
  loadingDocStatus?: DocStatus;
  trainIndex?: string | null;
  destinationStation?: string | null;
  unloadingDate?: string | null;
  unloadingDocStatus?: DocStatus;
  reportedLoadCount?: number | null;
}

export type ActionResult =
  | { ok: true; wagonId?: string }
  | { ok: false; error: string };
