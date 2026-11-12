import { z } from "zod";

export const createHelpRequest = z.object({
  title: z.string().min(3, "Title must have at least 3 characters"),
  description: z.string().min(5, "Description must have at least 5 characters"),

  categoryId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce.number().int().positive().nullable().optional()
  ),

  urgency: z.enum(["low", "medium", "high"]),

  preferredMode: z.enum(["text", "call"]),

  communityId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce.number().int().positive().nullable().optional()
  ),
});

export const getHelpRequestQuery = z.object({
  communityId: z
    .union([
      z.coerce.number().int().positive(),
      z.literal("null"),
    ])
    .optional(),

  status: z.enum(["open", "closed"]).optional(),
});

export const helpRequestAcceptValidation = z.object({
  helpRequestId: z.coerce.number().int(),
  mode: z.enum(["text", "call"]),
});