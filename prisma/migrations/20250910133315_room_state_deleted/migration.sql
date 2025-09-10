/*
  Warnings:

  - You are about to drop the `room_states` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "room_states" DROP CONSTRAINT "room_states_roomId_fkey";

-- DropTable
DROP TABLE "room_states";
