import { SuccessResponse } from "@/schemas/shared";
import { StoreItem } from "@/schemas/store-items";
import { ApiError } from "@/schemas/shared";
import { axiosInstance } from "@/utils/axios-instance";
import axios from "axios";
import { Report } from "@/schemas/reports";


export async function searchReports(
    limit: number,
    skip: number,
    reportType: string,
    reporterId: string,
    reportedPartyId: string,
): Promise<SuccessResponse<Report>> {
    try {
        const response = await axiosInstance.get(`/reports`, {
            params: {
                report_type: reportType,
                reporter_id: reporterId,
                reported_party_id: reportedPartyId,
                skip: skip,
                limit: limit,
            }
        });
        return response.data as SuccessResponse<Report>;
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