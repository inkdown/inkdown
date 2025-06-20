import { z } from "zod";
import { DirectorySchema } from "./directory-types";

export const NoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  createdAt: z.date().default(new Date()),
  type: z.string(),
  icon: z.string().default(""),
  archived: z.boolean().default(false),
  author_id: z.string().uuid(),

  reactions: z.array(z.any()).optional(),
  Share: z.array(z.any()).optional(),    
  Directory: DirectorySchema
    .nullable()
    .optional(),
  directoryId: z.number().int().optional(),
})