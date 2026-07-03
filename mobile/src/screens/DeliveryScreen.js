import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera as CameraIcon, ArrowLeft, Package, User, Check, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

// Note: In a bare workflow, you would use @react-native-ml-kit/text-recognition here.
// For compatibility with the current Expo setup, we'll simulate the OCR extraction
// if the native module isn't available, or use the real one if it is.
let TextRecognition;
try {
    TextRecognition = require('@react-native-ml-kit/text-recognition').default;
} catch (e) {
    TextRecognition = null;
}

const DeliveryScreen = ({ navigation }) => {
    const [projectCode, setProjectCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [matches, setMatches] = useState([]);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [rawText, setRawText] = useState('');

    useEffect(() => {
        loadProject();
    }, []);

    const loadProject = async () => {
        const p = await AsyncStorage.getItem('currentProject');
        if (p) setProjectCode(JSON.parse(p).code);
    };

    const handleCapture = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Camera access is required to scan parcel labels.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                processImage(result.assets[0].uri);
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to open camera');
        }
    };

    const processImage = async (imageUri) => {
        setLoading(true);
        setMatches([]);
        setSelectedRecipient(null);
        setRawText('');

        try {
            let extractedText = '';

            if (TextRecognition) {
                // Real ML Kit extraction (on-device, free, fast)
                const result = await TextRecognition.recognize(imageUri);
                extractedText = result.text;
            } else {
                // Mock extraction for testing if ML Kit isn't linked yet
                console.warn('[DeliveryScreen] ML Kit not found. Using mock text.');
                extractedText = "TO: JOHN SMITH \n FROM: AMAZON \n TRACKING: 1Z9999999999999999";
                // Simulate delay
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            setRawText(extractedText);

            // Send to backend for fuzzy matching against employee database
            const response = await api.post('/deliveries/ocr-match', {
                raw_text: extractedText,
                project_code: projectCode
            });

            if (response.data.success && response.data.matches.length > 0) {
                setMatches(response.data.matches);
            } else {
                Alert.alert('No Match Found', "We couldn't match the label text to any employee. Please log it manually.");
            }
        } catch (err) {
            console.error('[OCR Error]', err);
            Alert.alert('Analysis Failed', 'Could not process the image.');
        } finally {
            setLoading(false);
        }
    };

    const confirmLog = async () => {
        if (!selectedRecipient) return;

        setLoading(true);
        try {
            const now = new Date();
            const timeIn = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
            const date = now.toISOString().split('T')[0];

            await api.post('/logs', {
                project_code: projectCode,
                name: 'Courier',
                trade: 'Delivery Service',
                user_type: 'Delivery',
                visitor_group: 'Delivery',
                time_in: timeIn,
                date: date,
                // Add the selected recipient context so the backend can notify them
                reason: `Parcel for: ${selectedRecipient.name}`
            });

            Alert.alert('Delivery Logged', `Notification sent to ${selectedRecipient.name}.`, [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to log delivery');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f4ff' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: 'white' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4, marginRight: 16 }}>
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Package size={24} color="#d97706" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>Scan Delivery</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Intro Card */}
                <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4 }}>
                    <Text style={{ fontSize: 16, color: '#475569', textAlign: 'center', marginBottom: 24 }}>
                        Take a photo of the parcel shipping label. We'll read the name and notify the correct person.
                    </Text>
                    
                    <TouchableOpacity
                        onPress={handleCapture}
                        disabled={loading}
                        style={{
                            backgroundColor: '#2b4594',
                            borderRadius: 16,
                            paddingVertical: 16,
                            paddingHorizontal: 32,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                        }}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <CameraIcon size={24} color="white" style={{ marginRight: 12 }} />
                                <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Scan Label</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Results Section */}
                {matches.length > 0 && (
                    <View>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 }}>
                            Select Recipient
                        </Text>
                        
                        {matches.map((match) => (
                            <TouchableOpacity
                                key={match.id}
                                onPress={() => setSelectedRecipient(match)}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 16,
                                    padding: 16,
                                    marginBottom: 12,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderWidth: 2,
                                    borderColor: selectedRecipient?.id === match.id ? '#2b4594' : '#e2e8f0',
                                }}
                            >
                                <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#f0f4ff', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                    <User size={20} color="#2b4594" />
                                </View>
                                
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>{match.name}</Text>
                                    <Text style={{ fontSize: 14, color: '#64748b' }}>Match Confidence: {match.score}%</Text>
                                </View>

                                {selectedRecipient?.id === match.id && (
                                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#2b4594', alignItems: 'center', justifyContent: 'center' }}>
                                        <Check size={16} color="white" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}

                        {selectedRecipient && (
                            <TouchableOpacity
                                onPress={confirmLog}
                                disabled={loading}
                                style={{
                                    backgroundColor: '#10b981',
                                    borderRadius: 16,
                                    paddingVertical: 18,
                                    alignItems: 'center',
                                    marginTop: 12,
                                    shadowColor: '#10b981',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                    elevation: 6
                                }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '800' }}>Confirm & Notify Host</Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default DeliveryScreen;
