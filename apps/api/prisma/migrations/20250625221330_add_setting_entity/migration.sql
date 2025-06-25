/*
  Warnings:

  - Added the required column `settingsAuthorId` to the `authors` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "authors" ADD COLUMN     "settingsAuthorId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "settings" (
    "authorId" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "markdownLineStyler" BOOLEAN NOT NULL,
    "vimMode" BOOLEAN NOT NULL,
    "syntaxHighlighting" BOOLEAN NOT NULL,
    "bracketMathing" BOOLEAN NOT NULL,
    "autocompletion" BOOLEAN NOT NULL,
    "hightlightSelectionMatches" BOOLEAN NOT NULL,
    "hightlightActiveLine" BOOLEAN NOT NULL,
    "lineNumbers" BOOLEAN NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("authorId")
);

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
