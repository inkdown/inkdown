/*
  Warnings:

  - You are about to drop the column `authorId` on the `directories` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `reactions` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `shares` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `tags` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "directories" DROP CONSTRAINT "directories_authorId_fkey";

-- DropForeignKey
ALTER TABLE "notes" DROP CONSTRAINT "notes_authorId_fkey";

-- DropForeignKey
ALTER TABLE "reactions" DROP CONSTRAINT "reactions_authorId_fkey";

-- DropForeignKey
ALTER TABLE "shares" DROP CONSTRAINT "shares_authorId_fkey";

-- DropForeignKey
ALTER TABLE "tags" DROP CONSTRAINT "tags_authorId_fkey";

-- AlterTable
ALTER TABLE "directories" DROP COLUMN "authorId";

-- AlterTable
ALTER TABLE "notes" DROP COLUMN "authorId";

-- AlterTable
ALTER TABLE "reactions" DROP COLUMN "authorId";

-- AlterTable
ALTER TABLE "shares" DROP COLUMN "authorId";

-- AlterTable
ALTER TABLE "tags" DROP COLUMN "authorId";
