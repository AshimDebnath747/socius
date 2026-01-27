import { z } from 'zod';

export const updateUserSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        skills: z.array(z.string().min(1, "Skill cannot be empty"))
    })
});