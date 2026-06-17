-- CreateTable
CREATE TABLE "loading_plan_entries" (
    "id" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "rowNo" INTEGER,
    "stationText" TEXT,
    "wagonKind" TEXT,
    "wagonType" TEXT,
    "requestedRaw" TEXT,
    "requested" INTEGER,
    "providedRaw" TEXT,
    "provided" INTEGER,
    "requiredRaw" TEXT,
    "required" INTEGER,
    "approachNote" TEXT,
    "sourceFile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loading_plan_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loading_plan_entries_reportDate_idx" ON "loading_plan_entries"("reportDate");
