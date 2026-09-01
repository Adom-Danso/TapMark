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
    dob: z.string().min(1, 'Please select your date of birth.'),
    gender: z.string().refine((v: string) => ["male", "female"].includes(v), {
        message: "Invalid gender",
    }),
});

export type SignupSchemaType = z.infer<typeof SignupSchema>;
export type SignupSchemaInput = z.input<typeof SignupSchema>;


export const ForgotPasswordSchema = z.object({
    email: z.string().email(),
});

export type ForgotPasswordSchemaType = z.infer<typeof ForgotPasswordSchema>;
