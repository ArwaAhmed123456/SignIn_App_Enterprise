import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    Image, Modal, KeyboardAvoidingView, ScrollView, Platform,
    Alert, Animated, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, AlertCircle, MessageSquare, X, Send, Shield, Building2, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const StyledView = View;
const StyledText = Text;
const StyledTextInput = TextInput;
const StyledTouchableOpacity = TouchableOpacity;

const LandingScreen = ({ navigation }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Contact Modal State
    const [contactModalVisible, setContactModalVisible] = useState(false);
    const [contactEmail, setContactEmail] = useState('');
    const [contactQuery, setContactQuery] = useState('');
    const [contactLoading, setContactLoading] = useState(false);
    const [contactSuccess, setContactSuccess] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        checkExistingSession();
        api.get('/projects/ping').catch(() => console.log('Waking up server...'));
    }, []);

    useEffect(() => {
        if (!checkingSession) {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
            ]).start();
        }
    }, [checkingSession]);

    const checkExistingSession = async () => {
        try {
            const storedProject = await AsyncStorage.getItem('currentProject');
            if (storedProject) {
                const parsedProject = JSON.parse(storedProject);
                if (parsedProject && parsedProject.code) {
                    setCode(parsedProject.code);
                    const lastCheckIn = await AsyncStorage.getItem('lastCheckInDate');
                    const today = new Date().toISOString().split('T')[0];
                    if (lastCheckIn === today) {
                        navigation.replace('WorkerListScreen');
                        return;
                    }
                }
            }
        } catch (err) {
            console.error('[LandingScreen] Session check error:', err);
        } finally {
            setCheckingSession(false);
        }
    };

    if (checkingSession) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' }}>
                <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
                <View style={{ alignItems: 'center' }}>
                    <Image
                        source={require('../../assets/Tipod_Final_Logo_high_pixel.png')}
                        style={{ width: 80, height: 80, marginBottom: 24 }}
                        resizeMode="contain"
                    />
                    <ActivityIndicator size="large" color="#2b4594" />
                    <Text style={{ color: '#94a3b8', marginTop: 16, fontWeight: '600', fontSize: 14 }}>Resuming session...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const handleSubmit = async () => {
        if (!code) {
            setError('Please enter a project code to continue');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const trimmedCode = code.trim();
            const res = await api.post('/projects/verify-code', { code: trimmedCode });
            if (res.data.valid) {
                await AsyncStorage.removeItem('savedProjectCode');
                await AsyncStorage.setItem('rememberMe', 'false');
                const projectData = { ...res.data.project, code: trimmedCode };
                await AsyncStorage.setItem('currentProject', JSON.stringify(projectData));
                const lastCheckIn = await AsyncStorage.getItem('lastCheckInDate');
                const today = new Date().toISOString().split('T')[0];
                if (lastCheckIn === today) {
                    navigation.navigate('WorkerListScreen');
                } else {
                    navigation.navigate('MobileForm');
                }
            } else {
                setError(res.data.error || 'Invalid project code. Please try again.');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Connection error. Please check your network.');
        } finally {
            setLoading(false);
        }
    };

    const handleContactSubmit = async () => {
        if (!contactEmail.trim() || !contactQuery.trim()) {
            Alert.alert('Missing Fields', 'Please fill in all fields before sending.');
            return;
        }
        setContactLoading(true);
        try {
            const res = await api.post('/contact', { email: contactEmail, query: contactQuery });
            if (res.status === 200) {
                setContactSuccess(true);
                setContactEmail('');
                setContactQuery('');
                setTimeout(() => {
                    setContactModalVisible(false);
                    setContactSuccess(false);
                }, 2000);
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to send query. Please try again.');
        } finally {
            setContactLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f4ff' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#f0f4ff" />

            {/* Decorative top accent bar */}
            <View style={{ height: 4, backgroundColor: '#2b4594', width: '100%' }} />

            <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header / Brand Section */}
                    <View style={{ alignItems: 'center', marginBottom: 36 }}>
                        <View style={{ marginBottom: 20 }}>
                            <Image
                                source={require('../../assets/Tipod_Final_Logo_high_pixel.png')}
                                style={{ width: 96, height: 96 }}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={{ fontSize: 26, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5, textAlign: 'center' }}>
                            Attendance Pro
                        </Text>
                        <Text style={{ fontSize: 14, color: '#64748b', marginTop: 6, fontWeight: '500', textAlign: 'center', letterSpacing: 0.3 }}>
                            Secure site access for Tripod Services
                        </Text>
                    </View>

                    {/* Main Sign-In Card */}
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
                        {/* Card Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                            <View style={{ backgroundColor: '#eff6ff', padding: 10, borderRadius: 14, marginRight: 14 }}>
                                <Building2 size={22} color="#2b4594" />
                            </View>
                            <View>
                                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Enter Site Code</Text>
                                <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: '500' }}>Provided by your site manager</Text>
                            </View>
                        </View>

                        {/* Input Field */}
                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 2 }}>
                                Site Identifier
                            </Text>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderWidth: 2,
                                borderColor: isFocused ? '#2b4594' : (error ? '#ef4444' : '#e2e8f0'),
                                borderRadius: 16,
                                backgroundColor: isFocused ? '#f8fbff' : '#f8fafc',
                                paddingHorizontal: 18,
                                paddingVertical: 14,
                                shadowColor: isFocused ? '#2b4594' : 'transparent',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.15,
                                shadowRadius: 8,
                                elevation: isFocused ? 2 : 0,
                            }}>
                                <StyledTextInput
                                    placeholder="SITE-001"
                                    placeholderTextColor="#c8d0dc"
                                    style={{
                                        flex: 1,
                                        fontSize: 22,
                                        fontWeight: '900',
                                        color: '#0f172a',
                                        letterSpacing: 4,
                                        textAlign: 'center',
                                        textTransform: 'uppercase',
                                    }}
                                    value={code}
                                    onChangeText={(text) => {
                                        setCode(text.toUpperCase());
                                        setError('');
                                    }}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    autoCapitalize="characters"
                                    autoFocus
                                    returnKeyType="done"
                                    onSubmitEditing={handleSubmit}
                                />
                            </View>
                        </View>

                        {/* Error Message */}
                        {error ? (
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#fef2f2',
                                borderWidth: 1,
                                borderColor: '#fecaca',
                                borderRadius: 12,
                                padding: 12,
                                marginBottom: 20,
                                gap: 10,
                            }}>
                                <AlertCircle size={18} color="#dc2626" />
                                <Text style={{ flex: 1, color: '#dc2626', fontWeight: '600', fontSize: 13 }}>{error}</Text>
                            </View>
                        ) : null}

                        {/* CTA Button */}
                        <TouchableOpacity
                            onPress={handleSubmit}
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
                            {loading ? (
                                <>
                                    <ActivityIndicator color="white" size="small" />
                                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 16, marginLeft: 8 }}>
                                        Verifying...
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text style={{ color: 'white', fontWeight: '800', fontSize: 17, letterSpacing: 0.5 }}>
                                        Access Site
                                    </Text>
                                    <ChevronRight size={20} color="white" strokeWidth={3} />
                                </>
                            )}
                        </TouchableOpacity>

                        {loading && (
                            <Text style={{ textAlign: 'center', color: '#94a3b8', fontSize: 11, marginTop: 12, fontStyle: 'italic' }}>
                                Connecting to secure server...{'\n'}(May take up to 60s if server is asleep)
                            </Text>
                        )}
                    </View>

                    {/* Footer Actions */}
                    <View style={{ alignItems: 'center', gap: 12 }}>
                        {/* Manager Access */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('GuardDashboard')}
                            activeOpacity={0.8}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                backgroundColor: '#fff',
                                paddingVertical: 12,
                                paddingHorizontal: 20,
                                borderRadius: 50,
                                borderWidth: 1,
                                borderColor: '#e2e8f0',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.05,
                                shadowRadius: 4,
                                elevation: 2,
                            }}
                        >
                            <Shield size={15} color="#2b4594" />
                            <Text style={{ color: '#2b4594', fontWeight: '700', fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                Manager Access
                            </Text>
                        </TouchableOpacity>

                        {/* Contact Support */}
                        <TouchableOpacity
                            onPress={() => setContactModalVisible(true)}
                            activeOpacity={0.7}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12 }}
                        >
                            <MessageSquare size={13} color="#94a3b8" />
                            <Text style={{ color: '#94a3b8', fontWeight: '600', fontSize: 12 }}>
                                Need help? Contact Support
                            </Text>
                        </TouchableOpacity>

                        <Text style={{ fontSize: 10, color: '#cbd5e1', fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 }}>
                            Tripod Services · Secure Attendance
                        </Text>
                    </View>
                </ScrollView>
            </Animated.View>

            {/* Contact Support Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={contactModalVisible}
                onRequestClose={() => setContactModalVisible(false)}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' }}>
                        <View style={{
                            backgroundColor: '#fff',
                            borderTopLeftRadius: 32,
                            borderTopRightRadius: 32,
                            padding: 28,
                            minHeight: '60%',
                        }}>
                            {/* Modal Handle */}
                            <View style={{ width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 4, alignSelf: 'center', marginBottom: 20 }} />

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a' }}>Contact Support</Text>
                                <TouchableOpacity onPress={() => setContactModalVisible(false)} style={{
                                    backgroundColor: '#f1f5f9',
                                    padding: 8,
                                    borderRadius: 50,
                                }}>
                                    <X size={20} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                            <Text style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24, lineHeight: 20 }}>
                                Having trouble accessing your site? Send a message to your administrator.
                            </Text>

                            {contactSuccess ? (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                                    <View style={{ backgroundColor: '#dcfce7', borderRadius: 50, width: 80, height: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                                        <Send size={36} color="#16a34a" />
                                    </View>
                                    <Text style={{ fontSize: 22, fontWeight: '800', color: '#166534', marginBottom: 8 }}>Message Sent!</Text>
                                    <Text style={{ color: '#64748b', textAlign: 'center', lineHeight: 22 }}>
                                        Our support team will contact you shortly.
                                    </Text>
                                </View>
                            ) : (
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    <View style={{ marginBottom: 18 }}>
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Your Email</Text>
                                        <TextInput
                                            value={contactEmail}
                                            onChangeText={setContactEmail}
                                            placeholder="your@email.com"
                                            placeholderTextColor="#c8d0dc"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            style={{
                                                backgroundColor: '#f8fafc',
                                                padding: 16,
                                                borderRadius: 14,
                                                borderWidth: 1.5,
                                                borderColor: '#e2e8f0',
                                                fontSize: 15,
                                                color: '#0f172a',
                                                fontWeight: '500',
                                            }}
                                        />
                                    </View>
                                    <View style={{ marginBottom: 28 }}>
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Your Query</Text>
                                        <TextInput
                                            value={contactQuery}
                                            onChangeText={setContactQuery}
                                            placeholder="Describe your issue..."
                                            placeholderTextColor="#c8d0dc"
                                            multiline
                                            numberOfLines={4}
                                            style={{
                                                backgroundColor: '#f8fafc',
                                                padding: 16,
                                                borderRadius: 14,
                                                borderWidth: 1.5,
                                                borderColor: '#e2e8f0',
                                                fontSize: 15,
                                                color: '#0f172a',
                                                height: 110,
                                                textAlignVertical: 'top',
                                                fontWeight: '500',
                                            }}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        onPress={handleContactSubmit}
                                        disabled={contactLoading}
                                        activeOpacity={0.85}
                                        style={{
                                            backgroundColor: '#2b4594',
                                            paddingVertical: 18,
                                            borderRadius: 16,
                                            flexDirection: 'row',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: 10,
                                            shadowColor: '#2b4594',
                                            shadowOffset: { width: 0, height: 6 },
                                            shadowOpacity: 0.3,
                                            shadowRadius: 12,
                                            elevation: 6,
                                        }}
                                    >
                                        {contactLoading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <>
                                                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>Send Message</Text>
                                                <Send size={18} color="#fff" />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

export default LandingScreen;
