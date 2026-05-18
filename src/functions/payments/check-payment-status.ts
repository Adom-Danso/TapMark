import { SuccessResponse } from "@/schemas/shared";
import { ApiError } from "@/schemas/shared";
import { axiosInstance } from "@/utils/axios-instance";
import axios from "axios";
import { Payment } from "@/schemas/payments";


export async function checkPaymentStatus(
    payload: {reference: string, paymentId: string}
): Promise<SuccessResponse<Payment>> {
    try {
        const response = await axiosInstance.post(`/payments/check`, payload);
        return response.data as SuccessResponse<Payment>;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
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