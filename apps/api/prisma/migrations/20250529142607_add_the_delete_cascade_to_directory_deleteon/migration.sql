-- DropForeignKey
ALTER TABLE "directories" DROP CONSTRAINT "directories_parentId_fkey";

-- DropForeignKey
ALTER TABLE "notes" DROP CONSTRAINT "notes_directoryId_fkey";

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_directoryId_fkey" FOREIGN KEY ("directoryId") REFERENCES "directories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "directories" ADD CONSTRAINT "directories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "directories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
