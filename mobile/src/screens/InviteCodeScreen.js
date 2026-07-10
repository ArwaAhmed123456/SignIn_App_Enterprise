import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, HelpCircle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const BLUE = '#2b4594';

const InviteCodeScreen = ({ navigation }) => {
  const { activateMobile } = useAuth();
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);

  const formatCode = (raw) => {
    const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12);
    const parts = [];
    for (let i = 0; i < clean.length; i += 4) parts.push(clean.slice(i, i + 4));
    return parts.join('-');
  };

  const handleChange = (val) => setCode(formatCode(val));

  const handleConnect = async () => {
    const clean = code.replace(/-/g, '');
    if (clean.length !== 12) {
      Alert.alert('Invalid code', 'Please enter the full 12-character invite code.');
      return;
    }
    setLoading(true);
    const deviceId = Math.random().toString(36).slice(2, 18).toUpperCase();
    const result = await activateMobile(clean, deviceId);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Connection failed', result.message || 'Invalid or expired code. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Enter your invite code</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.desc}>
            Enter the 12-character code from your welcome email to connect this device.
          </Text>

          <TextInput
            value={code}
            onChangeText={handleChange}
            placeholder="XXXX-XXXX-XXXX"
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.input}
            maxLength={14}
            placeholderTextColor="#9ca3af"
          />

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={handleConnect}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#ffffff" />
              : <Text style={styles.btnText}>Connect</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpRow}
            activeOpacity={0.7}
            onPress={() => require('react-native').Alert.alert(
              'Where to find your code',
              'Your 12-character invite code was sent to your email when your account was created by an administrator.\n\nCheck your inbox for a welcome email from Tripod Services or Sign In App.\n\nIf you cannot find it, contact your site manager or admin to resend it.',
              [{ text: 'OK' }]
            )}
          >
            <HelpCircle size={18} color="#6b7280" />
            <Text style={styles.helpText}>Where do I find this?</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#ffffff' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  body:        { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  desc:        { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  input: {
    borderWidth: 2,
    borderColor: BLUE,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 5,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: '#f0f4ff',
  },
  btn: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText:  { fontSize: 17, fontWeight: '700', color: '#ffffff' },
  helpRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  helpText: { fontSize: 15, color: '#6b7280' },
});

export default InviteCodeScreen;
