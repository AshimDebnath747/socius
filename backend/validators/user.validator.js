import { z } from 'zod';

export const updateUserSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        skills: z.array(z.string().min(1, "Skill cannot be empty"))
    })
});

export const getReviewsValidation = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10)
})