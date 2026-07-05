import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { ArrowLeft, Check, LogOut } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ─── Step 1: Select site ──────────────────────────────────────────────────────
const SelectSiteStep = ({ onSelect }) => {
  const [sites, setSites]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects').then(r => setSites(r.data || [])).catch(() => setSites([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={s.centered}><ActivityIndicator color="#4ade80" size="large" /></View>;

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={s.stepTitle}>Select a site</Text>
      {sites.map(site => (
        <TouchableOpacity key={site.id} onPress={() => onSelect(site)} style={s.listItem} activeOpacity={0.75}>
          <View style={s.groupDot}><Text style={s.groupDotText}>{(site.name||'S')[0].toUpperCase()}</Text></View>
          <Text style={s.listItemText}>{site.name}</Text>
        </TouchableOpacity>
      ))}
      {sites.length === 0 && <Text style={s.empty}>No sites found</Text>}
    </ScrollView>
  );
};

// ─── Step 2: Select group ─────────────────────────────────────────────────────
const SelectGroupStep = ({ site, onSelect }) => {
  const [groups, setGroups]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/visitor-groups?project_id=${site.id}`)
      .then(r => setGroups(r.data || []))
      .catch(() => setGroups([
        { id: 'v', name: 'Visitors' }, { id: 'e', name: 'Employees' }, { id: 'd', name: 'Deliveries' }
      ]))
      .finally(() => setLoading(false));
  }, [site.id]);

  if (loading) return <View style={s.centered}><ActivityIndicator color="#4ade80" size="large" /></View>;

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={s.stepTitle}>Select a group</Text>
      <Text style={s.stepSub}>Please choose a group to sign in to:</Text>
      {groups.map(g => (
        <TouchableOpacity key={g.id} onPress={() => onSelect(g)} style={s.listItem} activeOpacity={0.75}>
          <View style={[s.groupDot, { backgroundColor: '#4ade80' }]}>
            <Text style={[s.groupDotText, { color: '#111827' }]}>{(g.name||'G')[0].toUpperCase()}</Text>
          </View>
          <Text style={s.listItemText}>{g.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ─── Step 3: Signed in confirmation ──────────────────────────────────────────
const SignedInStep = ({ visitName, site, time, visitId, onSignOut, onFinish }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [signingOut, setSigningOut]   = useState(false);

  const doSignOut = async () => {
    setSigningOut(true);
    try { if (visitId) await api.post(`/visits/public/${visitId}/sign-out`); } catch {}
    setSigningOut(false);
    onSignOut();
  };

  if (showConfirm) return (
    <View style={s.confirmWrap}>
      <View style={s.confirmCard}>
        <Text style={s.confirmTitle}>Sign out</Text>
        <Text style={s.confirmBody}>Are you sure you wish to sign out? You should only do this once your visit is complete and you are leaving the site.</Text>
        <View style={s.confirmBtns}>
          <TouchableOpacity onPress={() => setShowConfirm(false)}><Text style={s.confirmCancel}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity onPress={doSignOut} disabled={signingOut}>
            {signingOut ? <ActivityIndicator color="#ef4444" size="small" /> : <Text style={s.confirmSignOut}>Sign out</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={s.finishWrap}>
      <TouchableOpacity onPress={onFinish} style={s.finishBtn} activeOpacity={0.8}>
        <Text style={s.finishBtnText}>Finish</Text>
      </TouchableOpacity>
      <View style={s.thankContainer}>
        <View style={s.avatarCircle}><View style={s.greenDot} /></View>
        <Text style={s.thankText}>Thank you for visiting</Text>
      </View>
      <TouchableOpacity onPress={() => setShowConfirm(true)} style={s.signOutRow} activeOpacity={0.8}>
        <LogOut size={20} color="#ef4444" />
        <Text style={s.signOutText}>Tap to sign out</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Step 4: Signed out ───────────────────────────────────────────────────────
const SignedOutStep = ({ onFinish }) => (
  <View style={s.finishWrap}>
    <TouchableOpacity onPress={onFinish} style={s.finishBtn} activeOpacity={0.8}>
      <Text style={s.finishBtnText}>Finish</Text>
    </TouchableOpacity>
    <View style={s.thankContainer}>
      <View style={s.avatarCircle} />
      <Text style={s.thankText}>Thank you for signing out</Text>
    </View>
  </View>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const SignInFlowScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [step, setStep]       = useState('site');   // site|group|signed-in|signed-out
  const [site, setSite]       = useState(null);
  const [group, setGroup]     = useState(null);
  const [visitId, setVisitId] = useState(null);
  const [signInTime, setSignInTime] = useState('');
  const [signing, setSigning] = useState(false);

  const memberName = user?.name || user?.firstName || 'Member';

  const handleGroupSelect = async (g) => {
    setGroup(g);
    setSigning(true);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    setSignInTime(timeStr);
    try {
      const res = await api.post('/visits/public', {
        site_id: site.id, name: memberName, group: g.name,
      });
      setVisitId(res.data?.visit?.id || null);
    } catch (err) {
      console.error('Sign in error', err);
    }
    setSigning(false);
    setStep('signed-in');
  };

  const canGoBack = step === 'site' || step === 'group';

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        {canGoBack ? (
          <TouchableOpacity onPress={() => { if (step === 'site') navigation.goBack(); else setStep('site'); }} style={s.backBtn}>
            <ArrowLeft size={22} color="#111827" />
          </TouchableOpacity>
        ) : <View style={s.backBtn} />}
        <Text style={s.headerTitle}>
          {step === 'site' ? 'Select site' : step === 'group' ? 'Select a group' : ''}
        </Text>
        <View style={s.backBtn} />
      </View>

      {signing && <View style={s.centered}><ActivityIndicator color="#4ade80" size="large" /><Text style={{ marginTop: 12, color: '#6b7280' }}>Signing in…</Text></View>}
      {!signing && step === 'site'      && <SelectSiteStep  onSelect={(site) => { setSite(site); setStep('group'); }} />}
      {!signing && step === 'group'     && <SelectGroupStep site={site} onSelect={handleGroupSelect} />}
      {!signing && step === 'signed-in' && <SignedInStep visitName={memberName} site={site} time={signInTime} visitId={visitId} onSignOut={() => setStep('signed-out')} onFinish={() => navigation.goBack()} />}
      {!signing && step === 'signed-out'&& <SignedOutStep onFinish={() => navigation.goBack()} />}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#ffffff' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { fontSize: 18, fontWeight: '700', color: '#111827' },
  stepTitle:     { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 6 },
  stepSub:       { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  listItem:      { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  groupDot:      { width: 42, height: 42, borderRadius: 21, backgroundColor: '#2b4594', alignItems: 'center', justifyContent: 'center' },
  groupDotText:  { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  listItemText:  { fontSize: 17, fontWeight: '600', color: '#111827' },
  empty:         { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  centered:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  finishWrap:    { flex: 1, alignItems: 'center' },
  finishBtn:     { alignSelf: 'flex-end', margin: 16, backgroundColor: '#4ade80', paddingHorizontal: 22, paddingVertical: 10, borderRadius: 12 },
  finishBtnText: { fontSize: 16, fontWeight: '700', color: '#111827' },
  thankContainer:{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  avatarCircle:  { width: 96, height: 96, borderRadius: 48, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  greenDot:      { position: 'absolute', bottom: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#4ade80', borderWidth: 2, borderColor: '#ffffff' },
  thankText:     { fontSize: 20, fontWeight: '600', color: '#111827' },
  signOutRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginBottom: 40, backgroundColor: '#ffffff' },
  signOutText:   { fontSize: 16, fontWeight: '600', color: '#111827' },
  confirmWrap:   { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 40 },
  confirmCard:   { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
  confirmTitle:  { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 12 },
  confirmBody:   { fontSize: 15, color: '#4b5563', lineHeight: 22, marginBottom: 24 },
  confirmBtns:   { flexDirection: 'row', justifyContent: 'flex-end', gap: 32 },
  confirmCancel: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  confirmSignOut:{ fontSize: 16, fontWeight: '700', color: '#ef4444' },
});

export default SignInFlowScreen;
