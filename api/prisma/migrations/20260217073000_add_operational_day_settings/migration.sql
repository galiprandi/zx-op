-- AlterTable
ALTER TABLE "SystemSetting"
ADD COLUMN "operationalDayStart" TEXT NOT NULL DEFAULT '07:00',
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/Argentina/Tucuman';
