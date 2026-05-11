import axios from 'axios';

import { getTokens } from '@/utils/tokens';

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