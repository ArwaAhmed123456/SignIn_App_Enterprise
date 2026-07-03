import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Folder, LogOut, Clock, Check, X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

const AdminDashboard = ({ navigation }) => {
    const [projects, setProjects] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', code: '' });
    const [loading, setLoading] = useState(true);
    const { logout } = useAuth();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [projRes, reqRes] = await Promise.all([
                api.get('/projects'),
                api.get('/requests/pending')
            ]);
            setProjects(projRes.data);
            setPendingRequests(reqRes.data);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestAction = async (id, status) => {
        try {
            await api.put(`/requests/${id}/status`, { status });
            setPendingRequests(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            Alert.alert('Action Failed', 'Could not update request status.');
        }
    };

    const handleCreateProject = async () => {
        if (!newProject.name || !newProject.code) return;
        try {
            await api.post('/projects', newProject);
            setShowModal(false);
            setNewProject({ name: '', code: '' });
            fetchData();
        } catch (err) {
            Alert.alert('Error', 'Failed to create new project.');
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            <StyledView className="bg-white px-6 py-4 border-b border-gray-200 flex-row justify-between items-center">
                <StyledText className="text-2xl font-bold text-gray-800">Dashboard</StyledText>
                <StyledTouchableOpacity onPress={logout} className="p-2">
                    <LogOut size={22} color="#6b7280" />
                </StyledTouchableOpacity>
            </StyledView>

            <StyledScrollView className="flex-1 p-6">
                {pendingRequests.length > 0 && (
                    <StyledView className="mb-10">
                        <StyledView className="flex-row items-center mb-4">
                            <Clock size={20} color="#f97316" />
                            <StyledText className="text-lg font-bold text-gray-800 ml-2">Pending Approvals</StyledText>
                        </StyledView>
                        <StyledView className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
                            {pendingRequests.map(req => (
                                <StyledView key={req.id} className="p-5 border-b border-gray-50 flex-row justify-between items-center last:border-0">
                                    <StyledView className="flex-1 mr-4">
                                        <StyledView className="flex-row items-center mb-1">
                                            <StyledText className="font-bold text-gray-900 text-base">{req.user_name}</StyledText>
                                            <StyledView className="bg-gray-100 px-2 py-0.5 rounded ml-2">
                                                <StyledText className="text-[10px] font-mono text-gray-600">{req.project_code}</StyledText>
                                            </StyledView>
                                        </StyledView>
                                        <StyledText className="text-sm text-gray-500">
                                            For: <StyledText className="font-semibold text-orange-600">{req.requested_date}</StyledText>
                                        </StyledText>
                                    </StyledView>
                                    <StyledView className="flex-row gap-2">
                                        <StyledTouchableOpacity
                                            onPress={() => handleRequestAction(req.id, 'approved')}
                                            className="p-3 bg-green-50 rounded-xl border border-green-100"
                                        >
                                            <Check size={20} color="#16a34a" />
                                        </StyledTouchableOpacity>
                                        <StyledTouchableOpacity
                                            onPress={() => handleRequestAction(req.id, 'rejected')}
                                            className="p-3 bg-red-50 rounded-xl border border-red-100"
                                        >
                                            <X size={20} color="#dc2626" />
                                        </StyledTouchableOpacity>
                                    </StyledView>
                                </StyledView>
                            ))}
                        </StyledView>
                    </StyledView>
                )}

                <StyledView className="flex-row justify-between items-center mb-6">
                    <StyledText className="text-xl font-bold text-gray-800">Active Projects</StyledText>
                    <StyledTouchableOpacity
                        onPress={() => setShowModal(true)}
                        className="bg-blue-600 px-4 py-2 rounded-xl flex-row items-center"
                    >
                        <Plus size={18} color="white" />
                        <StyledText className="text-white font-bold ml-1">New</StyledText>
                    </StyledTouchableOpacity>
                </StyledView>

                {loading ? (
                    <ActivityIndicator color="#2563eb" />
                ) : (
                    <StyledView className="flex-row flex-wrap justify-between">
                        {projects.map(p => (
                            <StyledTouchableOpacity
                                key={p.id}
                                onPress={() => navigation.navigate('ProjectDetails', { project: p })}
                                className="w-[48%] bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4"
                            >
                                <StyledView className="bg-blue-50 w-12 h-12 rounded-xl items-center justify-center mb-4">
                                    <Folder size={24} color="#2563eb" />
                                </StyledView>
                                <StyledText className="font-bold text-gray-800 text-base mb-1" numberOfLines={1}>{p.name}</StyledText>
                                <StyledText className="text-xs font-mono text-gray-400">{p.code}</StyledText>
                            </StyledTouchableOpacity>
                        ))}
                    </StyledView>
                )}
            </StyledScrollView>

            {/* Create Project Modal */}
            <Modal visible={showModal} transparent animationType="slide">
                <StyledView className="flex-1 bg-black/50 justify-end">
                    <StyledView className="bg-white rounded-t-[40px] p-8 pb-12">
                        <StyledText className="text-2xl font-bold mb-6 text-gray-900">Create New Project</StyledText>

                        <StyledView>
                            <StyledView className="mb-4">
                                <StyledText className="text-sm font-medium text-gray-700 mb-2 ml-1">Project Name</StyledText>
                                <TextInput
                                    className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900"
                                    placeholder="The Shard Construction"
                                    value={newProject.name}
                                    onChangeText={text => setNewProject({ ...newProject, name: text })}
                                />
                            </StyledView>

                            <StyledView className="mb-4">
                                <StyledText className="text-sm font-medium text-gray-700 mb-2 ml-1">Unique Code</StyledText>
                                <TextInput
                                    className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 font-mono"
                                    placeholder="SITE-001"
                                    autoCapitalize="characters"
                                    value={newProject.code}
                                    onChangeText={text => setNewProject({ ...newProject, code: text.toUpperCase() })}
                                />
                            </StyledView>

                            <StyledView className="flex-row gap-4 mt-8">
                                <StyledTouchableOpacity
                                    onPress={() => setShowModal(false)}
                                    className="flex-1 py-4"
                                >
                                    <StyledText className="text-center font-bold text-gray-400 text-lg">Cancel</StyledText>
                                </StyledTouchableOpacity>
                                <StyledTouchableOpacity
                                    onPress={handleCreateProject}
                                    className="flex-1 bg-blue-600 py-4 rounded-2xl shadow-lg"
                                >
                                    <StyledText className="text-white text-center font-bold text-lg">Create</StyledText>
                                </StyledTouchableOpacity>
                            </StyledView>
                        </StyledView>
                    </StyledView>
                </StyledView>
            </Modal>
        </SafeAreaView>
    );
};

export default AdminDashboard;
