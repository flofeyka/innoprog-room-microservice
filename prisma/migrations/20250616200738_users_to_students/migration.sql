/*
  Warnings:

  - You are about to drop the column `users` on the `rooms` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "rooms" DROP COLUMN "users",
ADD COLUMN     "students" TEXT[];
