/**
 * MessagesScreen.js
 * Real-time in-app chat between guards and managers on the same site
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, RefreshCw } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const fmtTime = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  } catch { return ''; }
};

const roleBadge = (role) => {
  if (!role) return '';
  if (role === 'guard' || role === 'security') return 'Guard';
  if (role === 'manager') return 'Manager';
  if (role === 'admin' || role === 'superadmin') return 'Admin';
  return role;
};

const MessageBubble = ({ msg, isOwn }) => (
  <View style={[s.bubbleRow, isOwn ? s.bubbleRowOwn : s.bubbleRowOther]}>
    {!isOwn && (
      <View style={s.avatar}>
        <Text style={s.avatarTxt}>{(msg.senderName || '?')[0].toUpperCase()}</Text>
      </View>
    )}
    <View style={{ maxWidth: '72%' }}>
      {!isOwn && (
        <View style={s.senderRow}>
          <Text style={s.senderName}>{msg.senderName || 'Unknown'}</Text>
          <View style={[s.rolePill, msg.senderRole === 'manager' && s.rolePillManager]}>
            <Text style={s.rolePillTxt}>{roleBadge(msg.senderRole)}</Text>
          </View>
        </View>
      )}
      <View style={[s.bubble, isOwn ? s.bubbleOwn : s.bubbleOther,
        msg.type === 'alert' && s.bubbleAlert]}>
        <Text style={[s.bubbleTxt, isOwn && s.bubbleTxtOwn]}>{msg.text}</Text>
      </View>
      <Text style={[s.timeStamp, isOwn && s.timeStampOwn]}>{fmtTime(msg.createdAt)}</Text>
    </View>
  </View>
);

const MessagesScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  // Get site_id from route params first, then try multiple user fields
  const siteId  = route?.params?.siteId
    || user?.project_id
    || user?.site_id
    || user?.siteId
    || '';
  const siteName = route?.params?.siteName
    || user?.siteName
    || user?.organization
    || 'Site chat';

  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const flatRef = useRef(null);
  const pollRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!siteId) return;
    try {
      const res = await api.get(`/messages?site_id=${siteId}&limit=100`);
      setMessages(res.data || []);
    } catch (err) {
      console.log('MessagesScreen fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    fetchMessages();
    // Poll every 8 seconds for new messages (real-time feel without WebSockets)
    pollRef.current = setInterval(fetchMessages, 8000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await api.post('/messages', { text: trimmed, site_id: siteId });
      setText('');
      await fetchMessages();
    } catch (err) {
      Alert.alert('Could not send', err.response?.data?.error || 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSendAlert = async () => {
    Alert.alert(
      'Send alert to manager',
      'This will send a highlighted alert message to the manager.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send alert',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/messages', {
                text: `🚨 ALERT from ${user?.name || user?.firstName || 'Guard'}: ${text.trim() || 'Immediate attention required at the gate.'}`,
                site_id: siteId,
                type: 'alert',
              });
              setText('');
              await fetchMessages();
            } catch (err) {
              Alert.alert('Failed', err.response?.data?.error || 'Could not send alert.');
            }
          },
        },
      ]
    );
  };

  if (!siteId) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.centered}>
          <Text style={s.emptyText}>No site linked to your account. Please contact your administrator.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Team messages</Text>
          <Text style={s.headerSub}>{siteName}</Text>
        </View>
        <TouchableOpacity onPress={fetchMessages} style={s.refreshBtn}>
          <RefreshCw size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Role info bar */}
      <View style={s.infoBar}>
        <Text style={s.infoTxt}>
          Messages are visible to all guards and managers at <Text style={{ fontWeight: '700' }}>{siteName}</Text>.
        </Text>
      </View>

      {/* Messages list */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={s.centered}><ActivityIndicator size="large" color="#2b4594" /></View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(item) => String(item._id || item.id || Math.random())}
            renderItem={({ item }) => (
              <MessageBubble
                msg={item}
                isOwn={item.senderId === user?.id || item.senderId === String(user?.id)}
              />
            )}
            contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Text style={s.emptyText}>No messages yet. Start the conversation below.</Text>
              </View>
            }
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Input bar */}
        <View style={s.inputBar}>
          {/* Alert button — only for guards */}
          {(user?.role === 'guard' || user?.role === 'security') && (
            <TouchableOpacity onPress={handleSendAlert} style={s.alertBtn}>
              <Text style={s.alertBtnTxt}>🚨</Text>
            </TouchableOpacity>
          )}
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            style={s.input}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || sending}
            style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnDisabled]}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Send size={18} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f3f4f6' },
  centered:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle:   { fontSize: 17, fontWeight: '700', color: '#111827' },
  headerSub:     { fontSize: 12, color: '#6b7280', marginTop: 1 },
  refreshBtn:    { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  infoBar:       { backgroundColor: '#eff6ff', borderBottomWidth: 1, borderBottomColor: '#bfdbfe', paddingHorizontal: 16, paddingVertical: 8 },
  infoTxt:       { fontSize: 12, color: '#1d4ed8' },
  emptyWrap:     { paddingTop: 60, alignItems: 'center' },
  emptyText:     { color: '#9ca3af', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  bubbleRow:     { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  bubbleRowOwn:  { justifyContent: 'flex-end' },
  bubbleRowOther:{ justifyContent: 'flex-start' },
  avatar:        { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt:     { fontSize: 13, fontWeight: '700', color: '#6b7280' },
  senderRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  senderName:    { fontSize: 12, fontWeight: '600', color: '#374151' },
  rolePill:      { backgroundColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  rolePillManager: { backgroundColor: '#ede9fe' },
  rolePillTxt:   { fontSize: 10, fontWeight: '700', color: '#374151' },
  bubble:        { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleOwn:     { backgroundColor: '#2b4594', borderBottomRightRadius: 4 },
  bubbleOther:   { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#f3f4f6' },
  bubbleAlert:   { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  bubbleTxt:     { fontSize: 15, color: '#111827', lineHeight: 21 },
  bubbleTxtOwn:  { color: '#fff' },
  timeStamp:     { fontSize: 11, color: '#9ca3af', marginTop: 3, marginLeft: 4 },
  timeStampOwn:  { textAlign: 'right', marginRight: 4, marginLeft: 0 },
  inputBar:      { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  alertBtn:      { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fecaca' },
  alertBtnTxt:   { fontSize: 20 },
  input:         { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#111827', backgroundColor: '#f9fafb', maxHeight: 120 },
  sendBtn:       { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2b4594', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#cbd5e1' },
});

export default MessagesScreen;
