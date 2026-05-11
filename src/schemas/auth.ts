import { z } from "zod";


export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export type LoginSchemaType = z.infer<typeof LoginSchema>;


export const SignupSchema = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    password: z.string(),
    confirmPassword: z.string(),
    phoneNumber: z.string().min(10),
    campusId: z.string().min(1),
    dob: z.string().min(1),
    gender: z.string().refine((v) => ["male", "female"].includes(v), {
        message: "Invalid gender",
    }),
});

export type SignupSchemaType = z.infer<typeof SignupSchema>;