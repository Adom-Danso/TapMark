import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { getTokens, saveTokens } from '@/utils/tokens';
import { handleUnauthorized } from '@/utils/logout';

const APP_TYPE = 'regular'; // regular | seller | service_courier
const APP_VERSION = Constants.expoConfig?.version ?? 'unknown';
const APP_BUILD = String(
    (Platform.OS === 'ios'
        ? Constants.expoConfig?.ios?.buildNumber
        : Constants.expoConfig?.android?.versionCode) ?? APP_VERSION
);

const newRequestId = (): string => {
    const crypto = (globalThis as any).crypto;
    if (crypto?.randomUUID) return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const axiosInstance = axios.create({
    baseURL: process.env.EXPO_PUBLIC_BACKEND_URL,
});



axiosInstance.interceptors.request.use(async config => {
    const { accessToken, refreshToken } = await getTokens();

    config.headers = config.headers ?? {};
    // Do NOT force a JSON content-type here: axios sets application/json for
    // object payloads automatically, and forcing it breaks multipart uploads
    // (FormData) by serializing them to JSON. Mirrors the courier/seller apps.
    // config.headers['Content-Type'] = 'application/json';

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

    config.headers['X-APP-TYPE'] = APP_TYPE;
    config.headers['X-APP-VERSION'] = APP_VERSION;
    config.headers['X-APP-BUILD'] = APP_BUILD;
    config.headers['X-PLATFORM'] = Platform.OS;
    config.headers['X-OS-VERSION'] = String(Platform.Version);
    config.headers['X-REQUEST-ID'] = config.headers['X-REQUEST-ID'] ?? newRequestId();

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

