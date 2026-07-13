import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  Alert, KeyboardAvoidingView, ScrollView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, ChevronLeft, CheckCircle } from 'lucide-react-native';
import api from '../services/api';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSuccess(true);
    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.error || 'Unable to send reset email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f4ff' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#f0f4ff" />
        <View style={{ height: 4, backgroundColor: '#2b4594', width: '100%' }} />
        
        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#dcfce7',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}>
            <CheckCircle size={48} color="#16a34a" />
          </View>
          
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#0f172a', textAlign: 'center', marginBottom: 12 }}>
            Check your email
          </Text>
          
          <Text style={{ fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
            We've sent password reset instructions to{'\n'}
            <Text style={{ fontWeight: '700', color: '#2b4594' }}>{email}</Text>
          </Text>
          
          <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 32 }}>
            If you don't see the email, check your spam folder or contact your site manager for assistance.
          </Text>
          
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              backgroundColor: '#2b4594',
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 32,
              shadowColor: '#2b4594',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f4ff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f4ff" />
      <View style={{ height: 4, backgroundColor: '#2b4594', width: '100%' }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
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

          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={{ marginBottom: 36 }}>
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5, marginBottom: 8 }}>
                Forgot Password?
              </Text>
              <Text style={{ fontSize: 14, color: '#64748b', fontWeight: '500', lineHeight: 20 }}>
                Enter your email address and we'll send you instructions to reset your password.
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
              {/* Email Field */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                  marginBottom: 8,
                  marginLeft: 2,
                }}>
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
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder="guard@tripodsvcs.co.uk"
                    placeholderTextColor="#c8d0dc"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    returnKeyType="send"
                    onSubmitEditing={handleResetPassword}
                    style={{
                      flex: 1,
                      marginLeft: 12,
                      fontSize: 15,
                      color: '#0f172a',
                      fontWeight: '500',
                    }}
                  />
                </View>
              </View>

              {/* Reset Button */}
              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
                style={{
                  backgroundColor: loading ? '#7a96cc' : '#2b4594',
                  borderRadius: 16,
                  paddingVertical: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#2b4594',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: '800', fontSize: 17 }}>
                    Send Reset Instructions
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Help Text */}
            <View style={{
              backgroundColor: '#eff6ff',
              borderWidth: 1,
              borderColor: '#bfdbfe',
              borderRadius: 14,
              padding: 16,
            }}>
              <Text style={{ color: '#1e40af', fontSize: 13, lineHeight: 18, textAlign: 'center' }}>
                If you don't have access to your email, please contact your site manager for assistance.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
