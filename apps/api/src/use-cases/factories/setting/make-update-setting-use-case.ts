import { PrismaSettingRepository } from "@/repositories/prisma-setting-repository";
import { UpdateSettingUseCase } from "@/use-cases/setting/update-setting-use-case";

export function makeUpdateSettingUsecase() {
  const repo = new PrismaSettingRepository();

  return new UpdateSettingUseCase(repo);
}