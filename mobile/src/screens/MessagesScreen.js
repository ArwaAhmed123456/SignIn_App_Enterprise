/**
 * MessagesScreen.js
 * Real-time in-app chat between guards and managers on the same site.
 * Supports: Team Chat (group) and Direct Messages (DMs).
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, RefreshCw, ArrowLeft, MessageSquare, Users } from 'lucide-react-native';
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

// ── Message bubble ────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, isOwn }) => {
  const isAlert = msg.type === 'alert';
  return (
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
        <View style={[s.bubble, isOwn ? s.bubbleOwn : s.bubbleOther, isAlert && s.bubbleAlert]}>
          {/* Alert text must be black on red for readability */}
          <Text style={[s.bubbleTxt, isOwn && !isAlert && s.bubbleTxtOwn, isAlert && s.bubbleTxtAlert]}>
            {msg.text}
          </Text>
        </View>
        <Text style={[s.timeStamp, isOwn && s.timeStampOwn]}>{fmtTime(msg.createdAt)}</Text>
      </View>
    </View>
  );
};

// ── Contact card (for DM list) ────────────────────────────────────────────────
const ContactCard = ({ contact, onPress }) => (
  <TouchableOpacity style={s.contactCard} onPress={onPress} activeOpacity={0.75}>
    <View style={s.contactAvatar}>
      <Text style={s.contactAvatarTxt}>{(contact.name || '?')[0].toUpperCase()}</Text>
    </View>
    <View style={s.contactMeta}>
      <Text style={s.contactName}>{contact.name}</Text>
      <Text style={s.contactRole}>{roleBadge(contact.role)}</Text>
    </View>
    <MessageSquare size={18} color="#2b4594" />
  </TouchableOpacity>
);

// ── Main screen ───────────────────────────────────────────────────────────────
const MessagesScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const userRole = String(user?.mobileRole || user?.role || user?.group || '').toLowerCase();
  const isGuard = userRole.includes('guard') || userRole.includes('security');

  // Allow launching into DM directly from ManagerScreen guard list
  const initialReceiverId   = route?.params?.receiverId   || null;
  const initialReceiverName = route?.params?.receiverName || null;

  const siteId = route?.params?.siteId
    || user?.project_id
    || user?.site_id
    || user?.siteId
    || '';
  const siteName = route?.params?.siteName
    || user?.siteName
    || user?.organization
    || 'Site chat';

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]           = useState(initialReceiverId ? 'dm' : 'team');
  const [dmContact, setDmContact]           = useState(
    initialReceiverId ? { id: initialReceiverId, name: initialReceiverName || 'Contact' } : null
  );
  const [contacts, setContacts]             = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // ── Chat state ─────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const flatRef  = useRef(null);
  const pollRef  = useRef(null);

  // ── Fetch messages ─────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!siteId) return;
    try {
      let url = `/messages?site_id=${siteId}&limit=100`;
      if (activeTab === 'dm' && dmContact?.id) {
        url += `&receiver_id=${dmContact.id}`;
      }
      const res = await api.get(url);
      setMessages(res.data || []);
    } catch (err) {
      console.log('MessagesScreen fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [siteId, activeTab, dmContact]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    fetchMessages();
    clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchMessages, 8000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  // ── Fetch DM contacts ──────────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    if (!siteId) return;
    setLoadingContacts(true);
    try {
      const res = await api.get(`/guards/contacts?site_id=${siteId}`);
      setContacts(res.data || []);
    } catch (err) {
      console.log('Contacts fetch error:', err.message);
    } finally {
      setLoadingContacts(false);
    }
  }, [siteId]);

  useEffect(() => {
    if (activeTab === 'dm' && !dmContact) {
      fetchContacts();
    }
  }, [activeTab, dmContact, fetchContacts]);

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const body = { text: trimmed, site_id: siteId };
      if (activeTab === 'dm' && dmContact?.id) {
        body.receiver_id = dmContact.id;
      }
      await api.post('/messages', body);
      setText('');
      await fetchMessages();
    } catch (err) {
      Alert.alert('Could not send', err.response?.data?.error || 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  // ── Send alert (guards only, team chat only) ───────────────────────────────
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

  // ── No site linked ─────────────────────────────────────────────────────────
  if (!siteId) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.centered}>
          <Text style={s.emptyText}>No site linked to your account. Please contact your administrator.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── DM contact selection ───────────────────────────────────────────────────
  const showContactList = activeTab === 'dm' && !dmContact;

  return (
    <SafeAreaView style={s.container} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          {activeTab === 'dm' && dmContact && (
            <TouchableOpacity onPress={() => setDmContact(null)} style={s.backBtn}>
              <ArrowLeft size={20} color="#111827" />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle} numberOfLines={1}>
              {activeTab === 'dm' && dmContact
                ? `DM · ${dmContact.name}`
                : activeTab === 'dm'
                  ? 'Direct messages'
                  : 'Team messages'}
            </Text>
            <Text style={s.headerSub}>{siteName}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={fetchMessages} style={s.refreshBtn}>
          <RefreshCw size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        <TouchableOpacity
          onPress={() => { setActiveTab('team'); setDmContact(null); }}
          style={[s.tab, activeTab === 'team' && s.tabActive]}
        >
          <Users size={14} color={activeTab === 'team' ? '#2b4594' : '#6b7280'} />
          <Text style={[s.tabText, activeTab === 'team' && s.tabTextActive]}>Team Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('dm')}
          style={[s.tab, activeTab === 'dm' && s.tabActive]}
        >
          <MessageSquare size={14} color={activeTab === 'dm' ? '#2b4594' : '#6b7280'} />
          <Text style={[s.tabText, activeTab === 'dm' && s.tabTextActive]}>Direct Messages</Text>
        </TouchableOpacity>
      </View>

      {/* Info bar for team chat */}
      {activeTab === 'team' && (
        <View style={s.infoBar}>
          <Text style={s.infoTxt}>
            Messages are visible to all guards and managers at <Text style={{ fontWeight: '700' }}>{siteName}</Text>.
          </Text>
        </View>
      )}

      {/* DM info bar */}
      {activeTab === 'dm' && dmContact && (
        <View style={[s.infoBar, { backgroundColor: '#f0fdf4', borderBottomColor: '#bbf7d0' }]}>
          <Text style={[s.infoTxt, { color: '#166534' }]}>
            Private conversation with <Text style={{ fontWeight: '700' }}>{dmContact.name}</Text>.
          </Text>
        </View>
      )}

      {/* Contact list (DM tab, no contact selected) */}
      {showContactList ? (
        <View style={{ flex: 1 }}>
          {loadingContacts ? (
            <View style={s.centered}><ActivityIndicator size="large" color="#2b4594" /></View>
          ) : contacts.length === 0 ? (
            <View style={s.centered}>
              <MessageSquare size={40} color="#e5e7eb" />
              <Text style={[s.emptyText, { marginTop: 12 }]}>
                No contacts available.{'\n'}Contact your administrator if you need to send a direct message.
              </Text>
            </View>
          ) : (
            <FlatList
              data={contacts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ContactCard contact={item} onPress={() => setDmContact(item)} />
              )}
              contentContainerStyle={{ padding: 16 }}
            />
          )}
        </View>
      ) : (
        /* Messages list + input */
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
                  <Text style={s.emptyText}>
                    {activeTab === 'dm' && dmContact
                      ? `No messages with ${dmContact.name} yet. Send the first one!`
                      : 'No messages yet. Start the conversation below.'}
                  </Text>
                </View>
              }
              onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
            />
          )}

          {/* Input bar */}
          <View style={s.inputBar}>
            {/* Alert button — only for guards in team chat */}
            {isGuard && activeTab === 'team' && (
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
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f3f4f6' },
  centered:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle:     { fontSize: 17, fontWeight: '700', color: '#111827' },
  headerSub:       { fontSize: 12, color: '#6b7280', marginTop: 1 },
  backBtn:         { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  refreshBtn:      { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },

  // Tabs
  tabBar:          { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tab:             { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  tabActive:       { borderBottomWidth: 2, borderBottomColor: '#2b4594' },
  tabText:         { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive:   { color: '#2b4594' },

  infoBar:         { backgroundColor: '#eff6ff', borderBottomWidth: 1, borderBottomColor: '#bfdbfe', paddingHorizontal: 16, paddingVertical: 8 },
  infoTxt:         { fontSize: 12, color: '#1d4ed8' },
  emptyWrap:       { paddingTop: 60, alignItems: 'center' },
  emptyText:       { color: '#9ca3af', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  // Contact list
  contactCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#f3f4f6' },
  contactAvatar:   { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  contactAvatarTxt:{ fontSize: 18, fontWeight: '700', color: '#2b4594' },
  contactMeta:     { flex: 1 },
  contactName:     { fontSize: 15, fontWeight: '700', color: '#111827' },
  contactRole:     { fontSize: 12, color: '#6b7280', marginTop: 2 },

  // Bubbles
  bubbleRow:       { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  bubbleRowOwn:    { justifyContent: 'flex-end' },
  bubbleRowOther:  { justifyContent: 'flex-start' },
  avatar:          { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt:       { fontSize: 13, fontWeight: '700', color: '#6b7280' },
  senderRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  senderName:      { fontSize: 12, fontWeight: '600', color: '#374151' },
  rolePill:        { backgroundColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  rolePillManager: { backgroundColor: '#ede9fe' },
  rolePillTxt:     { fontSize: 10, fontWeight: '700', color: '#374151' },
  bubble:          { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleOwn:       { backgroundColor: '#2b4594', borderBottomRightRadius: 4 },
  bubbleOther:     { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#f3f4f6' },
  // Alert: light red background with BLACK text for readability
  bubbleAlert:     { backgroundColor: '#fee2e2', borderWidth: 1.5, borderColor: '#fca5a5' },
  bubbleTxt:       { fontSize: 15, color: '#111827', lineHeight: 21 },
  bubbleTxtOwn:    { color: '#fff' },
  bubbleTxtAlert:  { color: '#000000', fontWeight: '600' }, // black text on red background
  timeStamp:       { fontSize: 11, color: '#9ca3af', marginTop: 3, marginLeft: 4 },
  timeStampOwn:    { textAlign: 'right', marginRight: 4, marginLeft: 0 },

  // Input
  inputBar:        { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  alertBtn:        { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fecaca' },
  alertBtnTxt:     { fontSize: 20 },
  input:           { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#111827', backgroundColor: '#f9fafb', maxHeight: 120 },
  sendBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2b4594', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#cbd5e1' },
});

export default MessagesScreen;
