import { coerce, z } from "zod";

export const createCommunitySchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(150, "Name must be at most 150 characters"),

  description: z.string().max(1000, "Description too long").optional(),

  rules: z.string().max(2000, "Rules too long").optional(),

  is_private: z.coerce.boolean().optional(),
});
