import axios from 'axios';

import { getTokens } from '@/utils/tokens';

export const axiosInstance = axios.create({
    baseURL: process.env.EXPO_PUBLIC_BACKEND_URL,
});

// Runtime debug: show which baseURL is being used and log failed responses
if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('axios baseURL =', process.env.EXPO_PUBLIC_BACKEND_URL);
}

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

axiosInstance.interceptors.response.use(
    response => response,
    error => {
        try {
            // eslint-disable-next-line no-console
            console.log('AXIOS ERROR', {
                url: error.config?.url,
                method: error.config?.method,
                baseURL: error.config?.baseURL,
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
            });
        } catch (e) {
            // ignore logging errors
        }

        return Promise.reject(error);
    }
);