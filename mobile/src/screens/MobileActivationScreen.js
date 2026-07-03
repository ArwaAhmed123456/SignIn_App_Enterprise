import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Smartphone, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import * as Device from 'expo-device';

const MobileActivationScreen = ({ navigation }) => {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const { activateMobile } = useAuth(); // We'll assume this is added to AuthContext

    const handleActivate = async () => {
        const cleanToken = token.replace(/[^0-9]/g, '');
        if (cleanToken.length !== 12) {
            Alert.alert('Invalid Code', 'Please enter the 12-digit activation code sent to your email.');
            return;
        }

        setLoading(true);
        try {
            // Provide a device identifier
            const deviceId = Device.osBuildId || Device.modelId || 'expo-device-' + Date.now();
            
            const result = await activateMobile(cleanToken, deviceId);
            
            if (result.success) {
                // The AuthContext should handle storing the JWT and updating state,
                // which will automatically navigate the user to the Landing screen.
                Alert.alert('Success', result.message || 'Device paired successfully!');
            } else {
                Alert.alert('Activation Failed', result.message || 'Invalid or expired code.');
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    // Format token as XXXX-XXXX-XXXX for display
    const formatToken = (val) => {
        const clean = val.replace(/[^0-9]/g, '');
        let formatted = '';
        for (let i = 0; i < clean.length; i++) {
            if (i > 0 && i % 4 === 0) formatted += '-';
            formatted += clean[i];
        }
        return formatted;
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f4ff' }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }}>
                    
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', top: 20, left: 20, padding: 8 }}>
                        <ArrowLeft size={24} color="#64748b" />
                    </TouchableOpacity>

                    <View style={{ alignItems: 'center', marginBottom: 40 }}>
                        <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#2b4594', alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#2b4594', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }}>
                            <Smartphone size={40} color="white" />
                        </View>
                        <Text style={{ fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 12, textAlign: 'center' }}>Pair Device</Text>
                        <Text style={{ fontSize: 16, color: '#475569', textAlign: 'center', lineHeight: 24 }}>
                            Enter the 12-digit activation code sent to your email to link this device to your account.
                        </Text>
                    </View>

                    <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 }}>
                            Activation Code
                        </Text>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#f8fafc', marginBottom: 24 }}>
                            <Shield size={24} color="#94a3b8" />
                            <TextInput
                                value={token}
                                onChangeText={(t) => setToken(formatToken(t))}
                                placeholder="XXXX-XXXX-XXXX"
                                placeholderTextColor="#cbd5e1"
                                keyboardType="number-pad"
                                maxLength={14} // 12 digits + 2 dashes
                                style={{ flex: 1, marginLeft: 16, fontSize: 24, fontWeight: '700', color: '#2b4594', letterSpacing: 2 }}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleActivate}
                            disabled={loading || token.length < 14}
                            style={{
                                backgroundColor: token.length >= 14 ? '#2b4594' : '#94a3b8',
                                borderRadius: 16,
                                paddingVertical: 18,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '800', marginRight: 8 }}>Activate</Text>
                                    <ArrowRight size={20} color="white" strokeWidth={3} />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default MobileActivationScreen;
