import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    ScrollView, Alert, Image, Animated, StatusBar, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Mail, Lock, User, Phone, Eye, EyeOff, ChevronLeft, ChevronRight, CheckCircle, Building2, ChevronDown } from 'lucide-react-native';
import api from '../services/api';

const GuardSignup = ({ navigation }) => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sites, setSites] = useState([]);
    const [selectedSite, setSelectedSite] = useState(null);
    const [siteModalOpen, setSiteModalOpen] = useState(false);
    const [focus, setFocus] = useState({ name: false, email: false, phone: false, password: false, confirm: false });

    useEffect(() => {
        // Load available sites/companies for registration (public endpoint — no auth required)
        api.get('/projects/all-public')
            .then((r) => setSites(Array.isArray(r.data) ? r.data : r.data?.value || []))
            .catch(() => setSites([]));
    }, []);

    const handleSignup = async () => {
        const { name, email, password, confirmPassword } = formData;
        if (!name || !email || !password || !confirmPassword) { setError('All fields are required'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true);
        setError('');
        try {
            await api.post('/guards/signup', {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
                phone: formData.phone.trim() || undefined,
                project_id: selectedSite?.id || undefined,
            });
            Alert.alert(
                'Account Created!',
                'Your account is pending Manager approval. You will be able to log in once approved.',
                [{ text: 'OK', onPress: () => navigation.navigate('GuardLogin') }]
            );
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = (focused) => ({
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: focused ? '#2b4594' : '#e2e8f0',
        borderRadius: 14,
        backgroundColor: focused ? '#f8fbff' : '#f8fafc',
        paddingHorizontal: 16,
        paddingVertical: 14,
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f4ff' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#f0f4ff" />
            <View style={{ height: 4, backgroundColor: '#2b4594', width: '100%' }} />

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 28, paddingBottom: 60 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Back button */}
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 28,
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
                    <Text style={{ color: '#64748b', fontWeight: '600', fontSize: 13 }}>Back to Sign In</Text>
                </TouchableOpacity>

                {/* Header */}
                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                    <View style={{ marginBottom: 18 }}>
                        <Image
                            source={require('../../assets/Tipod_Final_Logo_high_pixel.png')}
                            style={{ width: 72, height: 72 }}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 7,
                        backgroundColor: '#eff6ff',
                        paddingVertical: 5,
                        paddingHorizontal: 12,
                        borderRadius: 50,
                        marginBottom: 10,
                    }}>
                        <Shield size={12} color="#2b4594" />
                        <Text style={{ color: '#2b4594', fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                            Enterprise Portal
                        </Text>
                    </View>

                    <Text style={{ fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5, marginBottom: 6 }}>
                        Create Account
                    </Text>
                    <Text style={{ fontSize: 14, color: '#64748b', fontWeight: '500', textAlign: 'center' }}>
                        Register for site access
                    </Text>
                </View>

                {/* Form Card */}
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
                {/* Company / Site selector */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 2 }}>
                            Company / Site *
                        </Text>
                        <TouchableOpacity
                            onPress={() => setSiteModalOpen(true)}
                            style={{
                                flexDirection: 'row', alignItems: 'center',
                                borderWidth: 2, borderColor: selectedSite ? '#2b4594' : '#e2e8f0',
                                borderRadius: 14, backgroundColor: selectedSite ? '#f0f4ff' : '#f8fafc',
                                paddingHorizontal: 16, paddingVertical: 14,
                            }}
                        >
                            <Building2 size={18} color={selectedSite ? '#2b4594' : '#94a3b8'} />
                            <Text style={{ flex: 1, marginLeft: 12, fontSize: 15, color: selectedSite ? '#0f172a' : '#c8d0dc', fontWeight: selectedSite ? '600' : '400' }}>
                                {selectedSite ? selectedSite.name : 'Select your company / site'}
                            </Text>
                            <ChevronDown size={16} color="#94a3b8" />
                        </TouchableOpacity>
                        {/* Site picker modal */}
                        <Modal visible={siteModalOpen} transparent animationType="slide" onRequestClose={() => setSiteModalOpen(false)}>
                            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
                                <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, maxHeight: '60%' }}>
                                    <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>Select Company / Site</Text>
                                    </View>
                                    <FlatList
                                        data={sites}
                                        keyExtractor={item => item.id}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                onPress={() => { setSelectedSite(item); setSiteModalOpen(false); }}
                                                style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                                            >
                                                <Text style={{ fontSize: 16, color: selectedSite?.id === item.id ? '#2b4594' : '#111827', fontWeight: selectedSite?.id === item.id ? '700' : '400' }}>{item.name}</Text>
                                                {selectedSite?.id === item.id && <CheckCircle size={18} color="#2b4594" />}
                                            </TouchableOpacity>
                                        )}
                                        ListEmptyComponent={
                                            <View style={{ padding: 24, alignItems: 'center' }}>
                                                <Text style={{ color: '#9ca3af', fontSize: 14 }}>No sites found. Contact your administrator.</Text>
                                            </View>
                                        }
                                    />
                                    <TouchableOpacity onPress={() => setSiteModalOpen(false)} style={{ margin: 16, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#6b7280' }}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>
                    </View>

                    {/* Full Name */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 2 }}>
                            Full Name
                        </Text>
                        <View style={inputStyle(focus.name)}>
                            <User size={18} color={focus.name ? '#2b4594' : '#94a3b8'} />
                            <TextInput
                                value={formData.name}
                                onChangeText={(val) => { setFormData({ ...formData, name: val }); setError(''); }}
                                onFocus={() => setFocus({ ...focus, name: true })}
                                onBlur={() => setFocus({ ...focus, name: false })}
                                placeholder="Officer Full Name"
                                placeholderTextColor="#c8d0dc"
                                style={{ flex: 1, marginLeft: 12, fontSize: 15, color: '#0f172a', fontWeight: '500' }}
                            />
                        </View>
                    </View>

                    {/* Email */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 2 }}>
                            Work Email
                        </Text>
                        <View style={inputStyle(focus.email)}>
                            <Mail size={18} color={focus.email ? '#2b4594' : '#94a3b8'} />
                            <TextInput
                                value={formData.email}
                                onChangeText={(val) => { setFormData({ ...formData, email: val }); setError(''); }}
                                onFocus={() => setFocus({ ...focus, email: true })}
                                onBlur={() => setFocus({ ...focus, email: false })}
                                placeholder="guard@tripodsvcs.co.uk"
                                placeholderTextColor="#c8d0dc"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                style={{ flex: 1, marginLeft: 12, fontSize: 15, color: '#0f172a', fontWeight: '500' }}
                            />
                        </View>
                    </View>

                    {/* Mobile / Phone */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 2 }}>
                            Mobile Number (Optional)
                        </Text>
                        <View style={inputStyle(focus.phone)}>
                            <Phone size={18} color={focus.phone ? '#2b4594' : '#94a3b8'} />
                            <TextInput
                                value={formData.phone}
                                onChangeText={(val) => { setFormData({ ...formData, phone: val }); setError(''); }}
                                onFocus={() => setFocus({ ...focus, phone: true })}
                                onBlur={() => setFocus({ ...focus, phone: false })}
                                placeholder="+44 7XXX XXXXXX"
                                placeholderTextColor="#c8d0dc"
                                keyboardType="phone-pad"
                                style={{ flex: 1, marginLeft: 12, fontSize: 15, color: '#0f172a', fontWeight: '500' }}
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 2 }}>
                            Password
                        </Text>
                        <View style={inputStyle(focus.password)}>
                            <Lock size={18} color={focus.password ? '#2b4594' : '#94a3b8'} />
                            <TextInput
                                value={formData.password}
                                onChangeText={(val) => { setFormData({ ...formData, password: val }); setError(''); }}
                                onFocus={() => setFocus({ ...focus, password: true })}
                                onBlur={() => setFocus({ ...focus, password: false })}
                                placeholder="Min. 6 characters"
                                placeholderTextColor="#c8d0dc"
                                secureTextEntry={!showPassword}
                                style={{ flex: 1, marginLeft: 12, fontSize: 15, color: '#0f172a', fontWeight: '500' }}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                                {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Confirm Password */}
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 2 }}>
                            Confirm Password
                        </Text>
                        <View style={inputStyle(focus.confirm)}>
                            <Lock size={18} color={focus.confirm ? '#2b4594' : '#94a3b8'} />
                            <TextInput
                                value={formData.confirmPassword}
                                onChangeText={(val) => { setFormData({ ...formData, confirmPassword: val }); setError(''); }}
                                onFocus={() => setFocus({ ...focus, confirm: true })}
                                onBlur={() => setFocus({ ...focus, confirm: false })}
                                placeholder="Re-enter password"
                                placeholderTextColor="#c8d0dc"
                                secureTextEntry={!showConfirmPassword}
                                style={{ flex: 1, marginLeft: 12, fontSize: 15, color: '#0f172a', fontWeight: '500' }}
                                returnKeyType="done"
                                onSubmitEditing={handleSignup}
                            />
                            {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                <CheckCircle size={18} color="#16a34a" />
                            )}
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 4, marginLeft: 4 }}>
                                {showConfirmPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Error */}
                    {error ? (
                        <View style={{
                            backgroundColor: '#fef2f2',
                            borderWidth: 1,
                            borderColor: '#fecaca',
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 20,
                        }}>
                            <Text style={{ color: '#dc2626', fontWeight: '600', fontSize: 13, textAlign: 'center' }}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Register Button */}
                    <TouchableOpacity
                        onPress={handleSignup}
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
                                <Text style={{ color: 'white', fontWeight: '800', fontSize: 17 }}>Create Account</Text>
                                <ChevronRight size={20} color="white" strokeWidth={3} />
                            </>
                        }
                    </TouchableOpacity>
                </View>

                {/* Sign In Link */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: '#94a3b8', fontSize: 14, fontWeight: '500' }}>Already have an account?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('GuardLogin')} activeOpacity={0.7}>
                        <Text style={{ color: '#2b4594', fontWeight: '800', fontSize: 14 }}>Sign in</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default GuardSignup;
