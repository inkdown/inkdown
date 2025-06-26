import { PrismaSettingRepository } from "@/repositories/prisma-setting-repository";

interface UpdateSettingRequest {
  theme?: string;
  markdownLineStyler?: boolean;
  vimMode?: boolean;
  syntaxHighlighting?: boolean;
  bracketMathing?: boolean;
  autocompletion?: boolean;
  hightlightSelectionMatches?: boolean;
  hightlightActiveLine?: boolean;
  lineNumbers?: boolean;
  authorId: string
}

export class UpdateSettingUseCase {

  constructor(private repo: PrismaSettingRepository) { };

  async update({
    authorId, autocompletion, bracketMathing,  hightlightActiveLine, hightlightSelectionMatches, lineNumbers, markdownLineStyler, syntaxHighlighting, theme, vimMode
  }: UpdateSettingRequest) {
    await this.repo.update({
      autocompletion, bracketMathing,  hightlightActiveLine, hightlightSelectionMatches, lineNumbers, markdownLineStyler, syntaxHighlighting, theme, vimMode
    }, authorId)
  }
}
