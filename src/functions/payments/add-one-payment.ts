import { SuccessResponse } from "@/schemas/shared";
import { ApiError } from "@/schemas/shared";
import { axiosInstance } from "@/utils/axios-instance";
import axios from "axios";
import { Payment } from "@/schemas/payments";

export type RequestBody = {
    userId: string, 
    cartId: string, 
    amount: number, 
    tempOrderId: string;
    paymentMethod: string;
    mobileMoney?: object;
    bank?: object;
}

export async function addOnePayment(
    payload: RequestBody
): Promise<SuccessResponse<Payment>> {
    try {
        const response = await axiosInstance.post(`/payments`, payload);
        return response.data as SuccessResponse<Payment>;
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