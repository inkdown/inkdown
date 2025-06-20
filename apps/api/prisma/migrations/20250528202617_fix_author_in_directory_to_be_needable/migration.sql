/*
  Warnings:

  - Added the required column `authorId` to the `directories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "directories" ADD COLUMN     "authorId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "directories" ADD CONSTRAINT "directories_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
