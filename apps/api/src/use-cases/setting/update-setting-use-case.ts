import { PrismaSettingRepository } from "@/repositories/prisma-setting-repository";

interface UpdateSettingRequest {
  theme: String | undefined;
  markdownLineStyler: Boolean | undefined;
  vimMode: Boolean | undefined;
  syntaxHighlighting: Boolean | undefined;
  bracketMathing: Boolean | undefined;
  autocompletion: Boolean | undefined;
  hightlightSelectionMatches: Boolean | undefined;
  hightlightActiveLine: Boolean | undefined;
  lineNumbers: Boolean | undefined;
}

export class UpdateSettingUseCase {

  constructor(private repo: PrismaSettingRepository) { };

  async update(data: UpdateSettingRequest) {

  }
}
