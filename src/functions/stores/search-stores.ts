import { SuccessResponse } from "@/schemas/shared";
import { Store } from "@/schemas/stores";
import { ApiError } from "@/schemas/shared";
import { axiosInstance } from "@/utils/axios-instance";
import axios from "axios";


export async function searchStores(
    limit: number,
    skip: number,
    name: string | null = null,
    sortBy: string | null = null,
    sortOrder: string | null = null,
    storeIds: string[] | null = null,
    shuffle: boolean = false,
    centerLat: number | null = null,
    centerLng: number | null = null,
    maxDistance: number | null = null,
    storeCategoryIds: string[] | null = null,
    minimumRating: number | null = null,
): Promise<SuccessResponse<Store[]>> {
    try {
        const response = await axiosInstance.get('/stores', {
            params: {
                name: name,
                limit: limit,
                skip: skip,
                sort_by: sortBy,
                sort_order: sortOrder,
                store_ids: storeIds,
                shuffle: shuffle,
                center_lat: centerLat,
                center_lng: centerLng,
                max_distance: maxDistance,
                store_category_ids: storeCategoryIds,
                minimum_rating: minimumRating,
            }
        });
        return response.data as SuccessResponse<Store[]>;

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