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
            const path = role === 'guard' ? '/guards/login' : '/auth/login';
            const response = await api.post(path, { email, password });
            const duration = Date.now() - startTime;

            console.log(`[AUTH] Login success in ${duration}ms`);

            const { user, token } = response.data;
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));
            setUser(user);
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
                await AsyncStorage.setItem('token', jwt_token);
                await AsyncStorage.setItem('user', JSON.stringify(guard));
                setUser(guard);
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
