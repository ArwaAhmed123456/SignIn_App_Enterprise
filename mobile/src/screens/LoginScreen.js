import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        setError('');
        setLoading(true);
        const result = await login(email, password);
        setLoading(false);
        if (result.success) {
            // Navigation will be handled by the root App component based on state
        } else {
            setError(result.message);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            <StyledView className="flex-1 justify-center p-6">
                <StyledTouchableOpacity
                    onPress={() => navigation.navigate('Landing')}
                    className="absolute top-12 left-6 p-2 bg-white rounded-full shadow-sm"
                >
                    <ArrowLeft size={24} color="#475569" />
                </StyledTouchableOpacity>

                <StyledView className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
                    <StyledView className="items-center mb-8">
                        <Image
                            source={require('../../assets/Tipod_Final_Logo_high_pixel.png')}
                            style={{ width: 120, height: 120 }}
                            resizeMode="contain"
                        />
                    </StyledView>

                    <StyledText className="text-3xl font-bold text-center mb-8 text-gray-800">Admin Login</StyledText>

                    <StyledView>
                        <StyledView className="mb-4">
                            <StyledText className="text-sm font-medium text-slate-700 mb-2 ml-1">Email Address</StyledText>
                            <StyledTextInput
                                className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 focus:border-primary"
                                placeholder="admin@example.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </StyledView>

                        <StyledView className="mt-4">
                            <StyledText className="text-sm font-medium text-slate-700 mb-2 ml-1">Password</StyledText>
                            <StyledTextInput
                                className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 focus:border-primary"
                                placeholder="********"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </StyledView>

                        {error ? <StyledText className="text-red-500 text-sm text-center mt-2">{error}</StyledText> : null}

                        <StyledTouchableOpacity
                            className={`bg-primary py-4 rounded-2xl mt-6 shadow-lg shadow-blue-100 border-b-4 border-secondary ${loading ? 'opacity-70' : ''}`}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <StyledText className="text-white text-center font-bold text-lg">Sign In</StyledText>
                            )}
                        </StyledTouchableOpacity>

                        {loading && (
                            <StyledText className="text-center text-xs text-slate-400 mt-4 font-medium italic">
                                Connecting to secure server... {'\n'}(May take up to 60s if server is asleep)
                            </StyledText>
                        )}
                    </StyledView>
                </StyledView>
            </StyledView>
        </SafeAreaView>
    );
};

export default LoginScreen;
