import { Prisma } from "@prisma/client";

export interface SettingRepository {
  update(data: Prisma.SettingsUncheckedUpdateInput, authorId: string): Promise<void>
}
