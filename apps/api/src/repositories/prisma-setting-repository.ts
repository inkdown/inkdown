import { Prisma } from "@prisma/client";
import { SettingRepository } from "./setting-repository";
import { prisma } from "@/lib/prisma";

export class PrismaSettingRepository implements SettingRepository {
  async update(data: Prisma.SettingsUncheckedUpdateInput, authorId: string): Promise<void> {
    await prisma.settings.update({
      where: {
        authorId: authorId
      },
      data
    });
  }
}
