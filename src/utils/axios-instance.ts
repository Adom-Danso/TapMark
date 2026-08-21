import axios from 'axios';

import { getTokens, saveTokens } from '@/utils/tokens';
import { handleUnauthorized } from '@/utils/logout';


export const axiosInstance = axios.create({
    baseURL: process.env.EXPO_PUBLIC_BACKEND_URL,
});



axiosInstance.interceptors.request.use(async config => {
    const { accessToken, refreshToken } = await getTokens();

    config.headers = config.headers ?? {};
    config.headers['Content-Type'] = 'application/json';

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
        delete config.headers.Authorization;
    }

    if (refreshToken) {
        config.headers['X-REFRESH-TOKEN'] = refreshToken;
    } else {
        delete config.headers['X-REFRESH-TOKEN'];
    }

    return config;
});

// Auth endpoints that should NOT trigger a logout on 401 (legitimate auth failures)
const AUTH_ENDPOINTS = [
    '/auth/login',
    '/auth/signup',
    '/auth/verify',
    '/auth/otp',
    '/auth/reset-password',
    '/auth/confirm-reset-password',
];

axiosInstance.interceptors.response.use(
    async response => {
        const authData = response.data?.authData;
        if (authData?.accessToken && authData?.refreshToken) {
            await saveTokens(authData.accessToken, authData.refreshToken);
        }
        return response;
    },
    error => {
        if (error.response?.status === 401) {
            const url = error.config?.url ?? '';
            const isAuthEndpoint = AUTH_ENDPOINTS.some(endpoint => url.includes(endpoint));
            if (!isAuthEndpoint) {
                handleUnauthorized();
            }
        }
        return Promise.reject(error);
    }
);

