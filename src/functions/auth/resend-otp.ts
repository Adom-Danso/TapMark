import { ApiError } from "@/schemas/shared";
import { axiosInstance } from "@/utils/axios-instance";
import { SuccessResponse } from "@/schemas/shared";
import { User } from "@/schemas/user";
import axios from "axios";
import { string } from "zod";

type RequestBody = {
    userId: string;
    mode: string;
}

export async function resendOtp (
    credentials: RequestBody
) : Promise<SuccessResponse<User>> {
    console.log("Resending OTP with credentials:", credentials);
    try {
        const response = await axiosInstance.post('/auth/otp', credentials);
        return response.data as SuccessResponse<User>;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                console.error("Error resending OTP:", error.response.data.detail);

                if (typeof error.response.data.detail === 'string') {
                    throw new ApiError(error.response.data.detail, error.response.status);
                } else {
                    const message = error.response.data.message || 'Server error';
                    const statusCode = error.response.status || 500;
                    delete error.response.data.message;
                    throw new ApiError(message, statusCode, error.response.data.detail);
                }

            } else if (error.request) {
                throw new ApiError('Network error. Please check your connection.', 503);
            } else {
                throw new ApiError(error.message, 500);
            }
        }

        throw new ApiError('An unexpected error occurred', 500);
    }
}