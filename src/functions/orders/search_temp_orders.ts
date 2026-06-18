import { SuccessResponse } from "@/schemas/shared";
import { StoreItem } from "@/schemas/store-items";
import { ApiError } from "@/schemas/shared";
import { axiosInstance } from "@/utils/axios-instance";
import axios from "axios";
import { Order, TempOrders } from "@/schemas/orders";


export async function searchTempOrders(
    userId: string | null = null,
    paymentTiming: string | null = null,
    hasSellerAccepted: boolean | null = null,
    sellerId: string | null = null,
): Promise<SuccessResponse<TempOrders[]>> {
    try {
        const response = await axiosInstance.get(`/orders/temp/1/search`, {
            params: {
                user_id: userId,
                payment_timing: paymentTiming,
                has_seller_accepted: hasSellerAccepted,
                seller_id: sellerId,
            }
        });
        return response.data as SuccessResponse<TempOrders[]>;

    } catch (error: any) {
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