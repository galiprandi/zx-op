-- AlterTable
ALTER TABLE "PlayerSession"
ADD COLUMN "lapsCount" INTEGER NOT NULL DEFAULT 0;

-- AlterEnum
ALTER TYPE "LogAction" ADD VALUE 'LAP';
