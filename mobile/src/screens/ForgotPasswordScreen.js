import React, { useState } from 'react';
import { Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, ChevronLeft, KeyRound, Lock, Mail } from 'lucide-react-native';
import api from '../services/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return Alert.alert('Enter a valid email', 'Please enter the email address for your account.');
    setLoading(true);
    try { await api.post('/auth/forgot-password', { email: address }); setStep('reset'); }
    catch (err) { Alert.alert('Unable to send code', err.response?.data?.error || 'Please try again.'); }
    finally { setLoading(false); }
  };
  const resetPassword = async () => {
    if (!/^\d{6}$/.test(code)) return Alert.alert('Enter the 6-digit code', 'Use the code from the email we sent you.');
    if (password.length < 8) return Alert.alert('Password too short', 'Your new password must be at least 8 characters.');
    if (password !== confirmPassword) return Alert.alert('Passwords do not match', 'Enter the same new password in both fields.');
    setLoading(true);
    try { await api.post('/auth/reset-password', { token: code, newPassword: password }); setStep('complete'); }
    catch (err) { Alert.alert('Could not reset password', err.response?.data?.error || 'The code may be invalid or expired.'); }
    finally { setLoading(false); }
  };
  const field = (Icon, props) => <View style={s.field}><Icon size={18} color="#2b4594" /><TextInput style={s.input} placeholderTextColor="#94a3b8" {...props} /></View>;
  if (step === 'complete') return <SafeAreaView style={s.page}><View style={s.complete}><CheckCircle size={56} color="#16a34a" /><Text style={s.title}>Password reset</Text><Text style={s.copy}>Your password has been changed. You can now sign in with the new password.</Text><TouchableOpacity style={s.button} onPress={() => navigation.goBack()}><Text style={s.buttonText}>Back to Sign In</Text></TouchableOpacity></View></SafeAreaView>;
  const isReset = step === 'reset';
  return <SafeAreaView style={s.page}><StatusBar barStyle="dark-content" /><KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><TouchableOpacity style={s.back} onPress={() => isReset ? setStep('email') : navigation.goBack()}><ChevronLeft size={17} color="#475569" /><Text style={s.backText}>Back</Text></TouchableOpacity><Text style={s.title}>{isReset ? 'Create a New Password' : 'Reset Your Password'}</Text><Text style={s.copy}>{isReset ? `Enter the 6-digit code sent to ${email}, then choose your new password.` : 'Enter your account email. We will send you a 6-digit verification code.'}</Text><View style={s.card}>{isReset ? <><Text style={s.label}>Verification Code</Text>{field(KeyRound, { value: code, onChangeText: (v) => setCode(v.replace(/\D/g, '').slice(0, 6)), placeholder: '6-digit code', keyboardType: 'number-pad', maxLength: 6, style: [s.input, s.code] })}<Text style={s.label}>New Password</Text>{field(Lock, { value: password, onChangeText: setPassword, placeholder: 'At least 8 characters', secureTextEntry: true })}<Text style={s.label}>Confirm New Password</Text>{field(Lock, { value: confirmPassword, onChangeText: setConfirmPassword, placeholder: 'Re-enter new password', secureTextEntry: true })}<TouchableOpacity disabled={loading} style={s.button} onPress={resetPassword}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Reset Password</Text>}</TouchableOpacity><TouchableOpacity disabled={loading} onPress={sendCode} style={s.link}><Text style={s.linkText}>Send a new code</Text></TouchableOpacity></> : <><Text style={s.label}>Email Address</Text>{field(Mail, { value: email, onChangeText: setEmail, placeholder: 'you@example.com', autoCapitalize: 'none', keyboardType: 'email-address', autoComplete: 'email' })}<TouchableOpacity disabled={loading} style={s.button} onPress={sendCode}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Send Verification Code</Text>}</TouchableOpacity></>}</View></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const s = StyleSheet.create({ page:{flex:1,backgroundColor:'#f0f4ff'},flex:{flex:1},content:{padding:24,flexGrow:1},back:{flexDirection:'row',alignItems:'center',alignSelf:'flex-start',gap:4,paddingVertical:8,marginBottom:30},backText:{color:'#475569',fontWeight:'700'},title:{fontSize:27,fontWeight:'800',color:'#0f172a',marginBottom:10},copy:{fontSize:15,lineHeight:22,color:'#64748b',marginBottom:28},card:{backgroundColor:'#fff',borderRadius:20,padding:22,borderWidth:1,borderColor:'#e2e8f0'},label:{fontSize:13,fontWeight:'700',color:'#334155',marginBottom:7,marginTop:12},field:{height:52,borderWidth:1,borderColor:'#cbd5e1',borderRadius:12,paddingHorizontal:14,flexDirection:'row',alignItems:'center',backgroundColor:'#f8fafc'},input:{flex:1,marginLeft:10,fontSize:16,color:'#0f172a'},code:{letterSpacing:8,fontWeight:'800'},button:{backgroundColor:'#2b4594',borderRadius:13,alignItems:'center',paddingVertical:16,marginTop:26},buttonText:{color:'#fff',fontSize:16,fontWeight:'800'},link:{alignItems:'center',paddingTop:18},linkText:{color:'#2b4594',fontWeight:'700'},complete:{flex:1,alignItems:'center',justifyContent:'center',padding:28}, });
