import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Production API URL (Main Deployment)
const PROD_URL = 'https://attendence-app-uzvt.onrender.com/api';

// 2. Local Development URL (Your PC's IP or Tunnel)
// Use your machine's IP (e.g., 192.168.100.XXX) or a tunnel URL (like ngrok)
// IMPORTANT: If testing on a physical phone, you MUST use your local IP, not localhost.
const DEV_URL = 'http://192.168.100.173:5000/api';

const API_BASE_URL = PROD_URL; // Toggle to PROD_URL for live app

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
