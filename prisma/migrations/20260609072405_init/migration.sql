-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RAHBAR', 'VIEWER');

-- CreateEnum
CREATE TYPE "DocStatus" AS ENUM ('SMGS', 'NO_DOC', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "WagonStatus" AS ENUM ('IN_COUNTRY', 'DEPARTED');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PREVIEW', 'COMMITTED', 'ROLLEDBACK');

-- CreateEnum
CREATE TYPE "RowStatus" AS ENUM ('OK', 'WARNING', 'ERROR');

-- CreateTable
CREATE TABLE "administrations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameUz" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "country" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "administrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameUz" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "railway" TEXT,
    "country" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wagons" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "administrationId" TEXT,
    "currentFactStationId" TEXT,
    "current5065StationId" TEXT,
    "totalLoadCount" INTEGER NOT NULL DEFAULT 0,
    "entryDate" TIMESTAMP(3),
    "exitDate" TIMESTAMP(3),
    "lastReportDate" TIMESTAMP(3),
    "status" "WagonStatus" NOT NULL DEFAULT 'IN_COUNTRY',
    "isDiscrepant" BOOLEAN NOT NULL DEFAULT false,
    "hasUndocumented" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wagons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wagon_records" (
    "id" TEXT NOT NULL,
    "wagonId" TEXT NOT NULL,
    "importBatchId" TEXT,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "sourceStation" TEXT,
    "factStationId" TEXT,
    "station5065Id" TEXT,
    "loadingStationId" TEXT,
    "loadingDate" TIMESTAMP(3),
    "loadingDocStatus" "DocStatus" NOT NULL DEFAULT 'UNKNOWN',
    "trainIndex" TEXT,
    "destinationStationId" TEXT,
    "unloadingDate" TIMESTAMP(3),
    "unloadingDocStatus" "DocStatus" NOT NULL DEFAULT 'UNKNOWN',
    "reportedLoadCount" INTEGER,
    "isNewLoading" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wagon_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "sourceStation" TEXT,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "uploadedById" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "warningRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportStatus" NOT NULL DEFAULT 'PREVIEW',

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_rows" (
    "id" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "rawJson" JSONB NOT NULL,
    "status" "RowStatus" NOT NULL DEFAULT 'OK',
    "messages" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "import_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "action" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "administrations_code_key" ON "administrations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "stations_code_key" ON "stations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "wagons_number_key" ON "wagons"("number");

-- CreateIndex
CREATE INDEX "wagons_isDiscrepant_idx" ON "wagons"("isDiscrepant");

-- CreateIndex
CREATE INDEX "wagons_status_idx" ON "wagons"("status");

-- CreateIndex
CREATE INDEX "wagons_administrationId_idx" ON "wagons"("administrationId");

-- CreateIndex
CREATE INDEX "wagon_records_wagonId_reportDate_idx" ON "wagon_records"("wagonId", "reportDate");

-- CreateIndex
CREATE INDEX "wagon_records_reportDate_idx" ON "wagon_records"("reportDate");

-- CreateIndex
CREATE INDEX "import_batches_reportDate_idx" ON "import_batches"("reportDate");

-- CreateIndex
CREATE INDEX "import_rows_importBatchId_idx" ON "import_rows"("importBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "users_login_key" ON "users"("login");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "wagons" ADD CONSTRAINT "wagons_administrationId_fkey" FOREIGN KEY ("administrationId") REFERENCES "administrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagons" ADD CONSTRAINT "wagons_currentFactStationId_fkey" FOREIGN KEY ("currentFactStationId") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagons" ADD CONSTRAINT "wagons_current5065StationId_fkey" FOREIGN KEY ("current5065StationId") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagon_records" ADD CONSTRAINT "wagon_records_wagonId_fkey" FOREIGN KEY ("wagonId") REFERENCES "wagons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagon_records" ADD CONSTRAINT "wagon_records_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagon_records" ADD CONSTRAINT "wagon_records_factStationId_fkey" FOREIGN KEY ("factStationId") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagon_records" ADD CONSTRAINT "wagon_records_station5065Id_fkey" FOREIGN KEY ("station5065Id") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagon_records" ADD CONSTRAINT "wagon_records_loadingStationId_fkey" FOREIGN KEY ("loadingStationId") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagon_records" ADD CONSTRAINT "wagon_records_destinationStationId_fkey" FOREIGN KEY ("destinationStationId") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
