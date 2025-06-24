-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "studentCursorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "studentEditCodeEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "studentSelectionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taskId" TEXT;
