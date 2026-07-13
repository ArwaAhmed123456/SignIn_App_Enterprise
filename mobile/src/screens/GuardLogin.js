import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    Image, Animated, StatusBar, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Mail, Lock, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GuardLogin = ({ navigation }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailFocused, setEmailFocused] = useState(false);
    const [passFocused, setPassFocused] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        loadSavedCredentials();
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
        ]).start();
    }, []);

    const loadSavedCredentials = async () => {
        try {
            const savedEmail = await AsyncStorage.getItem('guard_remember_email');
            if (savedEmail) {
                setEmail(savedEmail);
                setRememberMe(true);
            }
        } catch (error) {
            console.error('Failed to load saved credentials', error);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please enter your email and password');
            return;
        }
        setLoading(true);
        setError('');
        const cleanEmail = email.trim().toLowerCase();
        const result = await login(cleanEmail, password, 'guard');
        if (result.success) {
            if (rememberMe) {
                await AsyncStorage.setItem('guard_remember_email', cleanEmail);
            } else {
                await AsyncStorage.removeItem('guard_remember_email');
            }
        } else {
            setError(result.message || 'Invalid credentials. Please try again.');
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f4ff' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#f0f4ff" />
            <View style={{ height: 4, backgroundColor: '#2b4594', width: '100%' }} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                {/* Back Button */}
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 32,
                        alignSelf: 'flex-start',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        backgroundColor: '#fff',
                        borderRadius: 50,
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                    }}
                >
                    <ChevronLeft size={16} color="#64748b" />
                    <Text style={{ color: '#64748b', fontWeight: '600', fontSize: 13 }}>Back</Text>
                </TouchableOpacity>

                <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    {/* Header */}
                    <View style={{ alignItems: 'center', marginBottom: 36 }}>
                        <View style={{
                            backgroundColor: '#fff',
                            borderRadius: 28,
                            padding: 16,
                            marginBottom: 20,
                            shadowColor: '#2b4594',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.15,
                            shadowRadius: 20,
                            elevation: 10,
                        }}>
                            <Image
                                source={require('../../assets/Tipod_Final_Logo_high_pixel.png')}
                                style={{ width: 80, height: 80 }}
                                resizeMode="contain"
                            />
                        </View>

                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            backgroundColor: '#eff6ff',
                            paddingVertical: 6,
                            paddingHorizontal: 14,
                            borderRadius: 50,
                            marginBottom: 12,
                        }}>
                            <Shield size={13} color="#2b4594" />
                            <Text style={{ color: '#2b4594', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                                Enterprise Portal
                            </Text>
                        </View>

                        <Text style={{ fontSize: 26, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 }}>
                            Sign In
                        </Text>
                        <Text style={{ fontSize: 14, color: '#64748b', marginTop: 6, fontWeight: '500' }}>
                            Security guard and manager access
                        </Text>
                    </View>

                    {/* Login Card */}
                    <View style={{
                        backgroundColor: '#fff',
                        borderRadius: 28,
                        padding: 28,
                        shadowColor: '#0f172a',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.08,
                        shadowRadius: 24,
                        elevation: 6,
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                        marginBottom: 20,
                    }}>
                        {/* Email Field */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 2 }}>
                                Email Address
                            </Text>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderWidth: 2,
                                borderColor: emailFocused ? '#2b4594' : '#e2e8f0',
                                borderRadius: 14,
                                backgroundColor: emailFocused ? '#f8fbff' : '#f8fafc',
                                paddingHorizontal: 16,
                                paddingVertical: 14,
                            }}>
                                <Mail size={18} color={emailFocused ? '#2b4594' : '#94a3b8'} />
                                <TextInput
                                    value={email}
                                    onChangeText={(t) => { setEmail(t); setError(''); }}
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                    placeholder="guard@tripodsvcs.co.uk"
                                    placeholderTextColor="#c8d0dc"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    style={{ flex: 1, marginLeft: 12, fontSize: 15, color: '#0f172a', fontWeight: '500' }}
                                />
                            </View>
                        </View>

                        {/* Password Field */}
                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 2 }}>
                                Password
                            </Text>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderWidth: 2,
                                borderColor: passFocused ? '#2b4594' : '#e2e8f0',
                                borderRadius: 14,
                                backgroundColor: passFocused ? '#f8fbff' : '#f8fafc',
                                paddingHorizontal: 16,
                                paddingVertical: 14,
                            }}>
                                <Lock size={18} color={passFocused ? '#2b4594' : '#94a3b8'} />
                                <TextInput
                                    value={password}
                                    onChangeText={(t) => { setPassword(t); setError(''); }}
                                    onFocus={() => setPassFocused(true)}
                                    onBlur={() => setPassFocused(false)}
                                    placeholder="••••••••"
                                    placeholderTextColor="#c8d0dc"
                                    secureTextEntry={!showPassword}
                                    style={{ flex: 1, marginLeft: 12, fontSize: 15, color: '#0f172a', fontWeight: '500' }}
                                    returnKeyType="done"
                                    onSubmitEditing={handleLogin}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                                    {showPassword
                                        ? <EyeOff size={18} color="#94a3b8" />
                                        : <Eye size={18} color="#94a3b8" />
                                    }
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Remember Me & Forgot Password */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                            <TouchableOpacity
                                onPress={() => setRememberMe(!rememberMe)}
                                activeOpacity={0.7}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                            >
                                <View style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 6,
                                    borderWidth: 2,
                                    borderColor: rememberMe ? '#2b4594' : '#cbd5e1',
                                    backgroundColor: rememberMe ? '#2b4594' : '#fff',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                    {rememberMe && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>}
                                </View>
                                <Text style={{ color: '#64748b', fontWeight: '600', fontSize: 14 }}>Remember me</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                onPress={() => navigation.navigate('ForgotPassword')}
                                activeOpacity={0.7}
                            >
                                <Text style={{ color: '#2b4594', fontWeight: '700', fontSize: 13 }}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Error */}
                        {error ? (
                            <View style={{
                                backgroundColor: error.toLowerCase().includes('pending') || error.toLowerCase().includes('approval') ? '#fef3c7' : '#fef2f2',
                                borderWidth: 1,
                                borderColor: error.toLowerCase().includes('pending') || error.toLowerCase().includes('approval') ? '#fde68a' : '#fecaca',
                                borderRadius: 12,
                                padding: 14,
                                marginBottom: 20,
                            }}>
                                <Text style={{ color: error.toLowerCase().includes('pending') || error.toLowerCase().includes('approval') ? '#92400e' : '#dc2626', fontWeight: '700', fontSize: 13, textAlign: 'center', marginBottom: 6 }}>{error}</Text>
                                {(error.toLowerCase().includes('pending') || error.toLowerCase().includes('approval')) ? (
                                    <Text style={{ color: '#92400e', fontSize: 12, textAlign: 'center' }}>
                                        Your account is awaiting manager approval. Contact your site manager to get activated.
                                    </Text>
                                ) : (error.toLowerCase().includes('invalid') || error.toLowerCase().includes('credentials')) ? (
                                    <Text style={{ color: '#dc2626', fontSize: 12, textAlign: 'center' }}>
                                        Check your email and password. Use the Register link below if you don't have an account yet.
                                    </Text>
                                ) : null}
                            </View>
                        ) : null}

                        {/* Login Button */}
                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.85}
                            style={{
                                backgroundColor: loading ? '#7a96cc' : '#2b4594',
                                borderRadius: 16,
                                paddingVertical: 18,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                                shadowColor: '#2b4594',
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.35,
                                shadowRadius: 12,
                                elevation: 8,
                            }}
                        >
                            {loading
                                ? <ActivityIndicator color="white" size="small" />
                                : <>
                                    <Text style={{ color: 'white', fontWeight: '800', fontSize: 17 }}>Sign In</Text>
                                    <ChevronRight size={20} color="white" strokeWidth={3} />
                                </>
                            }
                        </TouchableOpacity>
                    </View>

                    {/* Sign Up Link */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                        <Text style={{ color: '#94a3b8', fontSize: 14, fontWeight: '500' }}>Need an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('GuardSignup')} activeOpacity={0.7}>
                            <Text style={{ color: '#2b4594', fontWeight: '800', fontSize: 14 }}>Register here</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default GuardLogin;
