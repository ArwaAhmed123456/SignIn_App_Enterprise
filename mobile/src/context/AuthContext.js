import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Failed to load user', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password, role = 'admin') => {
        try {
            const startTime = Date.now();
            const duration = Date.now() - startTime;

            // Try guard/member login first, then fall back to admin login
            // This covers both guards (created via People Directory with passwords)
            // and admins/managers (created via admin portal)
            let response = null;
            let lastError = null;

            const endpoints = role === 'guard'
                ? ['/guards/login', '/auth/login']   // guards first, then admin fallback
                : ['/auth/login', '/guards/login'];   // admins first, then guard fallback

            for (const path of endpoints) {
                try {
                    response = await api.post(path, { email, password });
                    console.log(`[AUTH] Login success via ${path} in ${Date.now() - startTime}ms`);
                    break;
                } catch (err) {
                    lastError = err;
                    // Only fall through if it was a 401 (wrong credentials would be same on both)
                    if (err.response?.status !== 401 && err.response?.status !== 404) break;
                }
            }

            if (!response) throw lastError;

            const userData = response.data.user || response.data.guard;
            const token = response.data.token || response.data.jwt_token;
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            return { success: true, duration };
        } catch (error) {
            console.error('[AUTH] Login error:', error);
            return { success: false, message: error.response?.data?.error || error.response?.data?.message || 'Login failed' };
        }
    };

    const activateMobile = async (token, deviceId) => {
        try {
            const response = await api.post('/guards/activate-mobile', { token, device_id: deviceId });
            if (response.data.success) {
                const { jwt_token, guard } = response.data;
                // Preserve role from token if present
                const userData = {
                    ...guard,
                    role: guard.role || guard.group || 'employee',
                };
                await AsyncStorage.setItem('token', jwt_token);
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
                return { success: true, message: response.data.message };
            }
            return { success: false, message: 'Activation failed.' };
        } catch (error) {
            console.error('[AUTH] Activation error:', error);
            return { success: false, message: error.response?.data?.error || 'Server error' };
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, activateMobile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
