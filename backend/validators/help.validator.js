import { z } from "zod";

export const createHelpRequest = z.object({
    title: z.string().min(3),
    description: z.string().min(5),
    category: z.string(),
    urgency: z.enum(["low", "medium", "high"]),
    preferredMode: z.enum(["text", "call"]),
    communityId: z.number().int().positive().nullish()
});

export const getHelpRequestQuery = z.object({
    communityId: z.union([
        z.coerce.number().int().positive(),
        z.literal("null")
    ]).optional(),

    status: z.enum(["open", "closed"]).optional()
});

export const helpRequestAcceptValidation = z.object({
    helpRequestId: z.number().int(),
    mode: z.string()
})

