import { z } from "zod";

export const reviewPostValidation = z.object({
    session_id: z.number().int(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(4)
})