import { SuccessResponse } from "@/schemas/shared";
import { StoreItem } from "@/schemas/store-items";
import { ApiError } from "@/schemas/shared";
import { axiosInstance } from "@/utils/axios-instance";
import axios from "axios";
import { Order } from "@/schemas/orders";


export async function searchOrders(
    limit: number,
    skip: number,
    userId: string | null = null,
    isOrderCompleted: boolean | null = null,
    paymentMethod: string | null = null,
    storeId: string | null = null,
    paymentStatus: string | null = null,
    dateRangeMin: string | null = null,
    dateRangeMax: string | null = null,
    paymentTiming: string | null = null,
    dispatchDate: string | null = null,
    isPickedUp: boolean | null = null,
): Promise<SuccessResponse<Order[]>> {
    try {
        const response = await axiosInstance.get('/orders', {
            params: {
                user_id: userId,
                limit: limit,
                skip: skip,
                is_order_completed: isOrderCompleted,
                store_id: storeId,
                payment_method: paymentMethod,
                payment_status: paymentStatus,
                date_range_min: dateRangeMin,
                date_range_max: dateRangeMax,
                payment_timing: paymentTiming,
                dispatch_date: dispatchDate,
                is_picked_up: isPickedUp,
            }
        });
        return response.data as SuccessResponse<Order[]>;

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