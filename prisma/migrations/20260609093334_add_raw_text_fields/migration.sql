-- AlterTable
ALTER TABLE "wagon_records" ADD COLUMN     "administrationText" TEXT,
ADD COLUMN     "destinationStationText" TEXT,
ADD COLUMN     "factStationText" TEXT,
ADD COLUMN     "isDiscrepant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loadingStationText" TEXT,
ADD COLUMN     "station5065Text" TEXT;

-- AlterTable
ALTER TABLE "wagons" ADD COLUMN     "administrationText" TEXT,
ADD COLUMN     "current5065StationText" TEXT,
ADD COLUMN     "currentFactStationText" TEXT;
