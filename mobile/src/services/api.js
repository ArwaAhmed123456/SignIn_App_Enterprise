import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const PROD_URL =
    Constants.expoConfig?.extra?.apiUrl ||
    'https://tripod-signin-app.onrender.com/api';

// In dev, always use production URL unless a local override is set
// This avoids hardcoded IPs breaking on different networks
const DEV_URL =
    Constants.expoConfig?.extra?.devApiUrl ||
    Constants.expoConfig?.extra?.apiUrl ||
    'https://tripod-signin-app.onrender.com/api';

const API_BASE_URL = __DEV__ ? DEV_URL : PROD_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // 60 seconds timeout (better for Render cold starts)
});

api.interceptors.request.use(
    async (config) => {
        console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, config.baseURL);
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        console.log(`[API Response] ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        if (error.code === 'ECONNABORTED') {
            console.error('[API Timeout Error] Request took too long');
        } else if (error.message === 'Network Error') {
            console.error('[API Network Error] Could not reach server. Check internet or local IP.');
        } else {
            console.error('[API Error Detail]', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url
            });
        }
        return Promise.reject(error);
    }
);

export default api;
