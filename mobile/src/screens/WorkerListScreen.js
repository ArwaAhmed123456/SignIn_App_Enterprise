import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Clock, LogOut, RotateCcw, Plus, Search, AlertCircle, CheckCircle, FileText } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

const StyledView = View;
const StyledText = Text;
const StyledTouchableOpacity = TouchableOpacity;

const WorkerListScreen = ({ navigation }) => {
    const [project, setProject] = useState(null);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(null); // ID of worker being processed
    const [currentLogId, setCurrentLogId] = useState(null);
    const [lastCheckInName, setLastCheckInName] = useState(null);
    const [lastCheckInCar, setLastCheckInCar] = useState(null);

    // For Undo Functionality
    const [showUndoModal, setShowUndoModal] = useState(false);
    const [recentLogs, setRecentLogs] = useState([]); // Fetch logs with time_out != null

    // Help Modal
    const [showHelpModal, setShowHelpModal] = useState(false);

    useEffect(() => {
        const loadStoredData = async () => {
            try {
                const storedLogId = await AsyncStorage.getItem('currentWorkerLogId');
                const storedName = await AsyncStorage.getItem('lastCheckInName');
                const storedCar = await AsyncStorage.getItem('lastCheckInCar');
                const storedDate = await AsyncStorage.getItem('lastCheckInDate');
                const today = new Date().toISOString().split('T')[0];

                // Clear old SQLite numeric IDs (MongoDB IDs are 24-char hex strings)
                if (storedLogId && storedLogId.length < 20) {
                    console.log('[WorkerList] Clearing old SQLite ID:', storedLogId);
                    await AsyncStorage.removeItem('currentWorkerLogId');
                    await AsyncStorage.removeItem('lastCheckInName');
                    await AsyncStorage.removeItem('lastCheckInCar');
                    await AsyncStorage.removeItem('lastCheckInDate');
                    setCurrentLogId(null);
                    setLastCheckInName(null);
                    setLastCheckInCar(null);
                    console.log('[WorkerList] ✅ Cleared old storage');
                } else if (storedDate === today && storedLogId) {
                    setCurrentLogId(storedLogId);
                    setLastCheckInName(storedName);
                    setLastCheckInCar(storedCar);
                    console.log('[WorkerList] Loaded storage:', { logId: storedLogId, name: storedName, car: storedCar });
                } else {
                    // If date doesn't match today or logId is missing, clear them
                    await AsyncStorage.removeItem('currentWorkerLogId');
                    await AsyncStorage.removeItem('lastCheckInName');
                    await AsyncStorage.removeItem('lastCheckInCar');
                    await AsyncStorage.removeItem('lastCheckInDate'); // Clear date as well
                    setCurrentLogId(null);
                    setLastCheckInName(null);
                    setLastCheckInCar(null);
                }
            } catch (err) {
                console.error('[WorkerList] Error loading storage:', err);
            }
        };
        loadStoredData();
    }, []);

    const loadProjectAndWorkers = async () => {
        setLoading(true);
        try {
            const p = await AsyncStorage.getItem('currentProject');
            // The following lines are now handled by the useEffect above for initial load and clearing
            // const logId = await AsyncStorage.getItem('currentWorkerLogId');
            // const name = await AsyncStorage.getItem('lastCheckInName');
            // const car = await AsyncStorage.getItem('lastCheckInCar');

            // console.log('[WorkerList] Loaded storage:', { logId, name, car });

            // if (logId) setCurrentLogId(logId);
            // if (name) setLastCheckInName(name);
            // if (car) setLastCheckInCar(car);

            if (!p) {
                navigation.replace('Landing');
                return;
            }
            const parsedProject = JSON.parse(p);

            if (!parsedProject || !parsedProject.code) {
                // Invalid project data, force re-login
                await AsyncStorage.removeItem('currentProject');
                navigation.replace('Landing');
                return;
            }

            setProject(parsedProject);
            fetchWorkers(parsedProject.code);
        } catch (error) {
            console.error('Error loading project:', error);
            navigation.replace('Landing'); // Fallback to landing on error
        } finally {
            // ensure loading is turned off if we didn't redirect (though redirect unmounts)
            // putting setLoading(false) here might cause memory leak warning if unmounted, 
            // but strictly speaking we should only set it if still mounted.
            // For now, let's rely on fetchWorkers to turn it off, or set it off here if we aren't fetching.
        }
    };

    const fetchWorkers = async (projectCode) => {
        try {
            const res = await api.get(`/logs/active/${projectCode}`);
            setWorkers(res.data);
        } catch (error) {
            console.error('Error fetching workers:', error);
            // Alert.alert('Error', 'Failed to load worker list');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadProjectAndWorkers();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        if (project) {
            fetchWorkers(project.code);
        }
    };

    const handleCheckout = (worker) => {
        Alert.alert(
            "Confirm Check Out",
            `Are you sure you want to check out ${worker.name}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Check Out",
                    style: "destructive",
                    onPress: async () => {
                        if (!project?.code) {
                            Alert.alert('Error', 'Project context lost. Please restart.');
                            return;
                        }
                        const workerId = worker._id || worker.id;
                        setCheckoutLoading(workerId);
                        try {
                            const now = new Date();
                            const localTimeOut = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

                            await api.post(`/logs/${workerId}/checkout`, { timeOut: localTimeOut });
                            // Optimistic update or refresh
                            fetchWorkers(project.code);
                        } catch (error) {
                            Alert.alert("Error", "Failed to check out");
                        } finally {
                            setCheckoutLoading(null);
                        }
                    }
                }
            ]
        );
    };

    const handleUndo = async (logId) => {
        try {
            await api.post(`/logs/${logId}/undo-checkout`);
            fetchRecentLogs(); // Refresh undo list
            if (project?.code) {
                fetchWorkers(project.code); // Refresh active list
            }
            Alert.alert("Success", "Checkout undone. Worker is back on site.");
        } catch (error) {
            Alert.alert("Error", "Failed to undo checkout");
        }
    }

    const fetchRecentLogs = async () => {
        if (!project) return;
        try {
            console.log('[WorkerList] Fetching recent logs for:', project.code);
            // Using the new public endpoint that doesn't require JWT
            const res = await api.get(`/logs/recent/${project.code}`);
            console.log('[WorkerList] Recent logs fetched:', res.data.length);
            setRecentLogs(res.data);
        } catch (error) {
            console.error("[WorkerList] Error fetching recent logs", error);
        }
    };

    const openUndoModal = () => {
        console.log('[WorkerList] Opening Undo Modal...');
        setShowUndoModal(true);
        fetchRecentLogs();
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('currentProject');
            await AsyncStorage.removeItem('currentWorkerLogId');
            await AsyncStorage.removeItem('lastCheckInName');
            await AsyncStorage.removeItem('lastCheckInCar');
            await AsyncStorage.removeItem('lastCheckInDate');
            navigation.replace('Landing');
        } catch (error) {
            console.error('Logout error:', error);
            navigation.replace('Landing');
        }
    };

    const renderWorkerItem = ({ item }) => {
        const isSelf = (item._id && currentLogId && item._id.toString() === currentLogId.toString()) ||
            (item.id && currentLogId && item.id.toString() === currentLogId.toString()) ||
            (item.name?.trim().toLowerCase() === lastCheckInName?.trim().toLowerCase() &&
                item.car_reg?.trim().toLowerCase() === lastCheckInCar?.trim().toLowerCase());

        const workerId = item._id || item.id;
        const isCheckingOut = checkoutLoading === workerId;

        // Generate avatar initials
        const initials = item.name
            ? item.name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
            : '?';

        return (
            <View style={{
                backgroundColor: '#fff',
                borderRadius: 20,
                marginBottom: 12,
                padding: 16,
                borderWidth: isSelf ? 2 : 1,
                borderColor: isSelf ? '#2b4594' : '#e8edf5',
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#0f172a',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
            }}>
                {/* Avatar */}
                <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: isSelf ? '#2b4594' : '#e8edf5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                    flexShrink: 0,
                }}>
                    <Text style={{ color: isSelf ? '#fff' : '#64748b', fontWeight: '800', fontSize: 16 }}>
                        {initials}
                    </Text>
                </View>

                {/* Info */}
                <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', flex: 1 }} numberOfLines={1}>
                            {item.name}
                        </Text>
                        {isSelf && (
                            <View style={{ backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 }}>
                                <Text style={{ color: '#2b4594', fontSize: 10, fontWeight: '700' }}>YOU</Text>
                            </View>
                        )}
                    </View>
                    <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '500', marginBottom: 6 }} numberOfLines={1}>
                        {[item.user_type, item.trade, item.car_reg].filter(Boolean).join(' · ')}
                    </Text>
                    {/* Time badge */}
                    <View style={{
                        alignSelf: 'flex-start',
                        backgroundColor: '#f0fdf4',
                        borderWidth: 1,
                        borderColor: '#bbf7d0',
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        borderRadius: 50,
                    }}>
                        <Text style={{ color: '#15803d', fontWeight: '700', fontSize: 11 }}>
                            ● ON SITE  {item.time_in}
                        </Text>
                    </View>
                </View>

                {/* Check Out Button */}
                <TouchableOpacity
                    onPress={() => handleCheckout(item)}
                    disabled={isCheckingOut}
                    activeOpacity={0.8}
                    style={{
                        backgroundColor: isCheckingOut ? '#f1f5f9' : '#fff1f2',
                        borderWidth: 1.5,
                        borderColor: isCheckingOut ? '#e2e8f0' : '#fecdd3',
                        borderRadius: 12,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        marginLeft: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 70,
                    }}
                >
                    {isCheckingOut ? (
                        <ActivityIndicator size="small" color="#ef4444" />
                    ) : (
                        <>
                            <LogOut size={14} color="#ef4444" />
                            <Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 10, marginTop: 4 }}>
                                CHECK OUT
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f4ff' }}>
                {/* Top accent bar */}
                <View style={{ height: 4, backgroundColor: '#2b4594', width: '100%' }} />

                {/* Header */}
                <View style={{
                    backgroundColor: '#fff',
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottomWidth: 1,
                    borderBottomColor: '#e8edf5',
                    shadowColor: '#0f172a',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 3,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Image
                            source={require('../../assets/Tipod_Final_Logo_high_pixel.png')}
                            style={{ width: 44, height: 44 }}
                            resizeMode="contain"
                        />
                        <View>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                Active Site
                            </Text>
                            <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a', lineHeight: 22 }} numberOfLines={1}>
                                {project?.name || 'Loading...'}
                            </Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ProjectDetails', { project })}
                            style={{ backgroundColor: '#eff6ff', padding: 9, borderRadius: 12 }}
                        >
                            <FileText size={18} color="#2b4594" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setShowHelpModal(true)}
                            style={{ backgroundColor: '#f8fafc', padding: 9, borderRadius: 12 }}
                        >
                            <AlertCircle size={18} color="#64748b" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleLogout}
                            style={{ backgroundColor: '#f8fafc', padding: 9, borderRadius: 12 }}
                        >
                            <LogOut size={18} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Bar */}
                <View style={{
                    backgroundColor: '#2b4594',
                    marginHorizontal: 20,
                    marginTop: 16,
                    borderRadius: 20,
                    padding: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    shadowColor: '#2b4594',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                    elevation: 8,
                }}>
                    <View>
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginBottom: 2 }}>
                            Workers On Site
                        </Text>
                        <Text style={{ color: '#fff', fontSize: 36, fontWeight: '900', lineHeight: 42 }}>
                            {workers.length}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '500', marginTop: 2 }}>
                            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={openUndoModal}
                        activeOpacity={0.8}
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.25)',
                            borderRadius: 14,
                            paddingVertical: 10,
                            paddingHorizontal: 14,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <RotateCcw size={14} color="rgba(255,255,255,0.85)" />
                        <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 12 }}>Undo Checkout</Text>
                    </TouchableOpacity>
                </View>

                {/* Section Title */}
                <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 10 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        On-Site Now
                    </Text>
                </View>

                {/* List */}
                <FlatList
                    data={workers}
                    renderItem={renderWorkerItem}
                    keyExtractor={item => (item._id || item.id).toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2b4594" />}
                    ListEmptyComponent={
                        !loading && (
                            <View style={{ alignItems: 'center', paddingTop: 60 }}>
                                <View style={{ backgroundColor: '#e8edf5', width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                    <User size={36} color="#94a3b8" />
                                </View>
                                <Text style={{ color: '#64748b', fontWeight: '800', fontSize: 18, marginBottom: 6 }}>
                                    Site is Empty
                                </Text>
                                <Text style={{ color: '#94a3b8', fontSize: 14, fontWeight: '500', textAlign: 'center', maxWidth: 260 }}>
                                    No workers are currently checked in. Tap + to be the first.
                                </Text>
                            </View>
                        )
                    }
                />

                {/* FAB - Add New Check In */}
                <View style={{ position: 'absolute', bottom: 32, right: 24 }}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('MobileForm')}
                        activeOpacity={0.85}
                        style={{
                            backgroundColor: '#2b4594',
                            width: 64,
                            height: 64,
                            borderRadius: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: '#2b4594',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.45,
                            shadowRadius: 16,
                            elevation: 12,
                        }}
                    >
                        <Plus size={30} color="white" strokeWidth={2.5} />
                    </TouchableOpacity>
                </View>

                {loading && (
                    <View style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(255,255,255,0.85)',
                        justifyContent: 'center', alignItems: 'center',
                    }}>
                        <ActivityIndicator size="large" color="#2b4594" />
                        <Text style={{ color: '#64748b', marginTop: 12, fontWeight: '600' }}>Loading site data...</Text>
                    </View>
                )}
            </SafeAreaView>

            {/* Undo Modal - Outside SafeAreaView for better reliability */}
            <Modal visible={showUndoModal} animationType="slide" onRequestClose={() => setShowUndoModal(false)}>
                <StyledView className="flex-1 bg-white p-6">
                    <StyledView className="flex-row justify-between items-center mb-6">
                        <StyledText className="text-2xl font-bold text-slate-900">Recently Checked Out</StyledText>
                        <StyledTouchableOpacity onPress={() => setShowUndoModal(false)}>
                            <StyledText className="text-primary font-bold text-lg">Done</StyledText>
                        </StyledTouchableOpacity>
                    </StyledView>

                    <FlatList
                        data={recentLogs}
                        keyExtractor={item => (item._id || item.id).toString()}
                        renderItem={({ item }) => (
                            <StyledView className="flex-row items-center justify-between py-4 border-b border-slate-100">
                                <StyledView>
                                    <StyledText className="font-bold text-slate-800 text-lg">{item.name}</StyledText>
                                    <StyledText className="text-slate-500">Out: {item.time_out} • {item.user_type}</StyledText>
                                </StyledView>
                                <StyledTouchableOpacity
                                    onPress={() => handleUndo(item._id || item.id)}
                                    className="bg-slate-100 px-4 py-2 rounded-lg"
                                >
                                    <StyledText className="text-slate-700 font-bold">Undo</StyledText>
                                </StyledTouchableOpacity>
                            </StyledView>
                        )}
                        ListEmptyComponent={
                            <StyledText className="text-center text-slate-400 mt-10">No recent check-outs found for today.</StyledText>
                        }
                    />
                </StyledView>
            </Modal>

            {/* Help Modal */}
            <Modal visible={showHelpModal} animationType="fade" transparent onRequestClose={() => setShowHelpModal(false)}>
                <StyledView className="flex-1 bg-slate-900/80 justify-center p-6">
                    <StyledView className="bg-white rounded-3xl p-6 shadow-2xl max-h-[80%]">
                        <StyledView className="flex-row justify-between items-center mb-6">
                            <StyledView className="flex-row items-center gap-3">
                                <StyledView className="bg-blue-50 p-2 rounded-full">
                                    <AlertCircle size={24} color="#2b4594" />
                                </StyledView>
                                <StyledText className="text-xl font-bold text-slate-900">How It Works</StyledText>
                            </StyledView>
                            <StyledTouchableOpacity onPress={() => setShowHelpModal(false)}>
                                <StyledText className="text-slate-400 font-bold">Close</StyledText>
                            </StyledTouchableOpacity>
                        </StyledView>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <StyledView className="mb-6">
                                <StyledText className="font-bold text-slate-800 mb-2 text-lg">1. Check In (1st Page)</StyledText>
                                <StyledText className="text-slate-600 leading-relaxed">
                                    Tap the large <StyledText className="text-primary font-bold">+</StyledText> button at the bottom right. Fill in your details (Name, Company, Car Reg) to check into the site.
                                </StyledText>
                            </StyledView>

                            <StyledView className="mb-6">
                                <StyledText className="font-bold text-slate-800 mb-2 text-lg">2. On Site List (2nd Page)</StyledText>
                                <StyledText className="text-slate-600 leading-relaxed">
                                    The main screen shows everyone currently on site. Use this to verify who is present.
                                </StyledText>
                            </StyledView>

                            <StyledView className="mb-6">
                                <StyledText className="font-bold text-slate-800 mb-2 text-lg">3. Project Summary (3rd Page)</StyledText>
                                <StyledText className="text-slate-600 leading-relaxed">
                                    Tap the <FileText size={16} color="#2b4594" /> icon at the top right to view the Project Summary. Here you can see total hours and export data.
                                </StyledText>
                            </StyledView>

                            <StyledView className="mb-6">
                                <StyledText className="font-bold text-slate-800 mb-2 text-lg">4. Checking Out</StyledText>
                                <StyledText className="text-slate-600 leading-relaxed">
                                    Find <StyledText className="font-bold text-slate-900">YOUR name</StyledText> in the list. Tap <StyledText className="text-red-500 font-bold">"Tap to Out"</StyledText> to sign off.
                                </StyledText>
                            </StyledView>

                            <StyledView className="mb-6">
                                <StyledText className="font-bold text-slate-800 mb-2 text-lg">5. Undo Mistake</StyledText>
                                <StyledText className="text-slate-600 leading-relaxed">
                                    Accidentally checked out? Tap <StyledText className="font-bold text-slate-700">"Undo Timeout"</StyledText> at the top of the list to bring yourself back on site.
                                </StyledText>
                            </StyledView>
                        </ScrollView>

                        <StyledTouchableOpacity
                            onPress={() => setShowHelpModal(false)}
                            className="bg-primary py-4 rounded-xl mt-4"
                        >
                            <StyledText className="text-white text-center font-bold text-lg">Got it!</StyledText>
                        </StyledTouchableOpacity>
                    </StyledView>
                </StyledView>
            </Modal>
        </>
    );
};

export default WorkerListScreen;
