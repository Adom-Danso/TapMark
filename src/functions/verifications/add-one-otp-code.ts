import { SuccessResponse } from "@/schemas/shared";
import { ApiError } from "@/schemas/shared";
import { axiosInstance } from "@/utils/axios-instance";
import axios from "axios";
import { OTPCode, OtpTypes } from "@/schemas/otp-codes";

export type RequestBody = {userId: string, otpType: OtpTypes, cartItemIds?: string[], orderId?: string}

export async function addOneOTPCode(
    payload: RequestBody
): Promise<SuccessResponse<OTPCode>> {
    try {
        const response = await axiosInstance.post(`/verifications`, payload);
        return response.data as SuccessResponse<OTPCode>;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                console.log(error.response.data)
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