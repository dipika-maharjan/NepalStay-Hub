import z from "zod";

export const UserSchema = z.object({
    name: z.string().min(1),
    email: z.email(),
    password: z.string().min(6),
    role: z.enum(["traveler", "host", "admin"]).default("traveler"),
    imageUrl: z.string().optional(),
});

export type UserType = z.infer<typeof UserSchema>;