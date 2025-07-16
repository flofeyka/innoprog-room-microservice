-- CreateEnum
CREATE TYPE "Language" AS ENUM ('js', 'py', 'cpp');

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "language" "Language" NOT NULL DEFAULT 'py';
