import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Lock } from 'lucide-react-native';
import api from '../services/api';

const StyledView = View;
const StyledText = Text;
const StyledTouchableOpacity = TouchableOpacity;
const StyledScrollView = ScrollView;
const StyledTextInput = TextInput;

const GuardDashboard = ({ navigation }) => {
    const [projectCode, setProjectCode] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [project, setProject] = useState(null);

    const handleStartSession = async () => {
        if (!projectCode.trim() || !password.trim()) {
            Alert.alert('Required', 'Please enter both Site Code and Security Code.');
            return;
        }
        setLoading(true);
        try {
            const code = projectCode.trim().toUpperCase();
            // 1. Verify Project Code
            const codeRes = await api.post('/projects/verify-code', { code });
            if (!codeRes.data.valid) {
                Alert.alert('Error', 'Invalid Project Code');
                return;
            }

            const projectData = codeRes.data.project;
            const projectId = projectData.id || projectData._id;

            // 2. Verify Password (Security Code)
            const accessRes = await api.post(`/projects/${projectId}/verify-access`, { password });

            if (accessRes.data.success) {
                // Navigate to ProjectDetails for the logs and export
                navigation.navigate('ProjectDetails', { project: projectData });
            } else {
                Alert.alert('Denied', 'Incorrect Security Code');
            }
        } catch (err) {
            console.error('[GuardDashboard] Access error:', err);
            Alert.alert('Error', err.response?.data?.error || 'Could not verify access.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigation.navigate('Landing');
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <StyledView className="bg-white px-6 py-4 border-b border-slate-100 flex-row justify-between items-center">
                <StyledView className="flex-row items-center">
                    <TouchableOpacity onPress={handleBack} className="mr-3">
                        <ArrowLeft size={24} color="#64748b" />
                    </TouchableOpacity>
                    <Image
                        source={require('../../assets/Tipod_Final_Logo_high_pixel.png')}
                        style={{ width: 30, height: 30, marginRight: 10 }}
                        resizeMode="contain"
                    />
                    <StyledText className="text-xl font-bold text-slate-900">Manager Access</StyledText>
                </StyledView>
            </StyledView>

            <StyledView className="flex-1 justify-center p-8">
                <StyledView className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 items-center">
                    <StyledText className="text-2xl font-bold text-slate-900 text-center uppercase tracking-tight">Project Security</StyledText>
                    <StyledText className="text-slate-500 text-center mt-2 mb-8 font-medium">Enter credentials to export site data.</StyledText>

                    <StyledView className="w-full mb-4">
                        <StyledText className="text-xs font-bold text-primary uppercase mb-2 ml-1">Site Code</StyledText>
                        <StyledTextInput
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-center text-xl font-bold text-slate-900 uppercase"
                            placeholder="SITE-123"
                            value={projectCode}
                            onChangeText={setProjectCode}
                            autoCapitalize="characters"
                        />
                    </StyledView>

                    <StyledView className="w-full mb-8">
                        <StyledText className="text-xs font-bold text-primary uppercase mb-2 ml-1">Security Code</StyledText>
                        <StyledTextInput
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-center text-xl font-bold text-slate-900"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </StyledView>

                    <StyledTouchableOpacity
                        onPress={handleStartSession}
                        disabled={loading}
                        className="bg-primary w-full py-5 rounded-2xl shadow-xl border-b-4 border-secondary flex-row justify-center items-center"
                    >
                        {loading ? <ActivityIndicator color="white" /> : (
                            <>
                                <StyledText className="text-white font-bold text-lg mr-2 uppercase">Verify & Access</StyledText>
                                <Lock size={20} color="white" />
                            </>
                        )}
                    </StyledTouchableOpacity>
                </StyledView>
            </StyledView>
        </SafeAreaView>
    );
};

export default GuardDashboard;
