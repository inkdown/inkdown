import { makeUpdateSettingUsecase } from "@/use-cases/factories/setting/make-update-setting-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export async function updateSetting(req: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    theme: z.string().optional(),
    markdownLineStyler: z.boolean().optional(),
    vimMode: z.boolean().optional(),
    syntaxHighlighting: z.boolean().optional(),
    bracketMathing: z.boolean().optional(),
    autocompletion: z.boolean().optional(),
    hightlightSelectionMatches: z.boolean().optional(),
    hightlightActiveLine: z.boolean().optional(),
    lineNumbers: z.boolean().optional(),
  });

  const {
    theme,
    markdownLineStyler,
    vimMode,
    syntaxHighlighting,
    bracketMathing,
    autocompletion,
    hightlightSelectionMatches,
    hightlightActiveLine,
    lineNumbers,
  } = schema.parse(req.body);

  const authorId = req.user.sub;

  try {

    const useCase = makeUpdateSettingUsecase();

    await useCase.update({
      theme,
      markdownLineStyler,
      vimMode,
      syntaxHighlighting,
      bracketMathing,
      autocompletion,
      hightlightSelectionMatches,
      hightlightActiveLine,
      lineNumbers,
      authorId
    });

  } catch (err) {
    return reply.status(500).send({
      message: err
    });
  }

}
