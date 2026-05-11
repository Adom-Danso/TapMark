import { SuccessResponse } from "@/schemas/shared";
import { Campus } from "@/schemas/campuses";
import { ApiError } from "@/schemas/shared";
import { axiosInstance } from "@/utils/axios-instance";
import axios from "axios";


export async function searchCampuses(
    limit: number,
    skip: number,
    name: string | null = null,
): Promise<SuccessResponse<Campus[]>> {
    try {
        const response = await axiosInstance.get('/campuses', {
            params: {
                name: name,
                limit: limit,
                skip: skip,
            }
        });
        return response.data as SuccessResponse<Campus[]>;

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