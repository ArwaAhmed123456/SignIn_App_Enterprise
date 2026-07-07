/**
 * SecurityGuardScreen.js
 * Role: Security Guard
 * - Sign in/out visitors AND himself
 * - Clear view of who is present / signed-in / signed-out
 * - Pre-registration of visitors
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
  StyleSheet, ActivityIndicator, RefreshControl, TextInput,
  Alert, Modal,
} from 'react-native';
import { LogIn, LogOut, RefreshCw, Search, ChevronDown, X, UserPlus, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const fmtTime = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  } catch { return '—'; }
};

const TABS = ['On Site', 'Signed Out', 'Pre-register'];

// Sign-out confirmation modal
const SignOutModal = ({ visitor, onCancel, onConfirm, loading }) => (
  <Modal visible transparent animationType="fade">
    <View style={s.modalOverlay}>
      <View style={s.modalCard}>
        <Text style={s.modalTitle}>Sign out {visitor?.name}?</Text>
        <Text style={s.modalBody}>Confirm that {visitor?.name} has left the site.</Text>
        <View style={s.modalBtns}>
          <TouchableOpacity onPress={onCancel} style={s.modalCancelBtn}>
            <Text style={s.modalCancelTxt}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onConfirm} disabled={loading} style={s.modalConfirmBtn}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.modalConfirmTxt}>Sign out</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const SecurityGuardScreen = ({ navigation }) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab]   = useState('On Site');
  const [sites, setSites]           = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [siteOpen, setSiteOpen]     = useState(false);
  const [onSite, setOnSite]         = useState([]);
  const [signedOut, setSignedOut]   = useState([]);
  const [expected, setExpected]     = useState([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Guard's own sign-in state
  const [guardSignedIn, setGuardSignedIn] = useState(false);
  const [guardVisitId, setGuardVisitId]   = useState(null);
  const [guardSignTime, setGuardSignTime] = useState('');
  const [guardSigning, setGuardSigning]   = useState(false);

  // Sign-out modal
  const [signOutTarget, setSignOutTarget]   = useState(null);
  const [signingOutVisitor, setSigningOutVisitor] = useState(false);

  const guardName = user?.name || user?.firstName || 'Guard';

  const load = useCallback(async () => {
    try {
      const sitesRes = await api.get('/projects');
      const siteList = sitesRes.data || [];
      setSites(siteList);
      const site = selectedSite || siteList[0] || null;
      if (site && !selectedSite) setSelectedSite(site);

      if (site) {
        const [signedInRes, signedOutRes, preregRes] = await Promise.all([
          api.get(`/visits?site_id=${site.id}&status=signed_in&limit=100`).catch(() => ({ data: [] })),
          api.get(`/visits?site_id=${site.id}&status=signed_out&limit=50`).catch(() => ({ data: [] })),
          api.get(`/pre-registrations?site_id=${site.id}&status=Pending`).catch(() => ({ data: [] })),
        ]);
        setOnSite(signedInRes.data?.visits || signedInRes.data || []);
        setSignedOut(signedOutRes.data?.visits || signedOutRes.data || []);
        setExpected(preregRes.data || []);
      }
    } catch (err) {
      console.log('SecurityGuardScreen load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSite]);

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  // Guard signs himself in/out
  const handleGuardSignIn = async () => {
    if (!selectedSite) { Alert.alert('Select a site first'); return; }
    setGuardSigning(true);
    try {
      const res = await api.post('/visits/public', {
        site_id: selectedSite.id,
        name: guardName,
        group: 'Employees',
      });
      const now = new Date();
      setGuardSignTime(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
      setGuardVisitId(res.data?.visit?.id || null);
      setGuardSignedIn(true);
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Could not sign in');
    } finally { setGuardSigning(false); }
  };

  const handleGuardSignOut = async () => {
    setGuardSigning(true);
    try {
      if (guardVisitId) await api.post(`/visits/public/${guardVisitId}/sign-out`);
      setGuardSignedIn(false);
      setGuardVisitId(null);
      load();
    } catch { setGuardSignedIn(false); setGuardVisitId(null); }
    finally { setGuardSigning(false); }
  };

  // Sign out a visitor
  const handleSignOutVisitor = async () => {
    if (!signOutTarget) return;
    setSigningOutVisitor(true);
    try {
      await api.post(`/visits/public/${signOutTarget.id || signOutTarget._id}/sign-out`);
      setSignOutTarget(null);
      load();
    } catch {
      Alert.alert('Error', 'Could not sign out visitor');
      setSignOutTarget(null);
    } finally { setSigningOutVisitor(false); }
  };

  const filteredOnSite = onSite.filter(v =>
    !search || (v.name || v.visitor_name || '').toLowerCase().includes(search.toLowerCase())
  );
  const filteredSignedOut = signedOut.filter(v =>
    !search || (v.name || v.visitor_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centered}><ActivityIndicator size="large" color="#4ade80" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={s.shieldIcon}><ShieldCheck size={20} color="#fff" /></View>
          <View>
            <Text style={s.headerTitle}>Security Guard</Text>
            <Text style={s.headerSub}>{guardName}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={load} style={s.refreshBtn}>
          <RefreshCw size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Guard own sign in/out */}
      <View style={s.guardCard}>
        {guardSignedIn ? (
          <View style={s.guardSignedRow}>
            <View>
              <Text style={s.guardStatus}>Signed in at {guardSignTime}</Text>
              <Text style={s.guardSub}>{selectedSite?.name || 'Site'}</Text>
            </View>
            <TouchableOpacity onPress={handleGuardSignOut} disabled={guardSigning} style={s.guardSignOutBtn}>
              {guardSigning
                ? <ActivityIndicator color="#ef4444" size="small" />
                : <><LogOut size={16} color="#ef4444" /><Text style={s.guardSignOutTxt}>Sign out</Text></>
              }
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={handleGuardSignIn} disabled={guardSigning} style={s.guardSignInBtn}>
            {guardSigning
              ? <ActivityIndicator color="#fff" size="small" />
              : <><LogIn size={18} color="#fff" /><Text style={s.guardSignInTxt}>Sign yourself in</Text></>
            }
          </TouchableOpacity>
        )}
      </View>

      {/* Site picker */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8, backgroundColor: '#fff', zIndex: 10 }}>
        <TouchableOpacity onPress={() => setSiteOpen(v => !v)} style={s.sitePickerBtn}>
          <Text style={s.sitePickerText}>{selectedSite?.name || 'Select site'}</Text>
          <ChevronDown size={16} color="#6b7280" />
        </TouchableOpacity>
        {siteOpen && (
          <View style={s.siteDropdown}>
            {sites.map(s2 => (
              <TouchableOpacity key={s2.id} onPress={() => { setSelectedSite(s2); setSiteOpen(false); load(); }} style={s.siteOption}>
                <Text style={[s.siteOptionTxt, selectedSite?.id === s2.id && { color: '#4ade80', fontWeight: '700' }]}>{s2.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[s.tab, activeTab === t && s.tabActive]}>
            <Text style={[s.tabText, activeTab === t && s.tabTextActive]}>{t}</Text>
            {t === 'On Site' && onSite.length > 0 && (
              <View style={s.tabBadge}><Text style={s.tabBadgeTxt}>{onSite.length}</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      {activeTab !== 'Pre-register' && (
        <View style={s.searchRow}>
          <Search size={16} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name..."
            style={s.searchInput}
            placeholderTextColor="#9ca3af"
          />
          {search ? <TouchableOpacity onPress={() => setSearch('')}><X size={16} color="#9ca3af" /></TouchableOpacity> : null}
        </View>
      )}

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ade80" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >

        {/* ── ON SITE ── */}
        {activeTab === 'On Site' && (
          <>
            <Text style={s.sectionTitle}>{filteredOnSite.length} signed in</Text>
            {filteredOnSite.length === 0 ? (
              <View style={s.emptyCard}><Text style={s.emptyText}>Nobody signed in right now</Text></View>
            ) : (
              filteredOnSite.map(v => (
                <View key={v.id || v._id} style={s.visitCard}>
                  <View style={[s.visitAvatar, { backgroundColor: '#dcfce7' }]}>
                    <Text style={[s.visitAvatarTxt, { color: '#16a34a' }]}>{(v.name || '?')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.visitName}>{v.name || v.visitor_name}</Text>
                    <Text style={s.visitSub}>{v.group || v.visitor_group} · in {fmtTime(v.sign_in_time || v.createdAt)}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSignOutTarget(v)}
                    style={s.signOutChip}
                  >
                    <LogOut size={14} color="#ef4444" />
                    <Text style={s.signOutChipTxt}>Sign out</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}

        {/* ── SIGNED OUT ── */}
        {activeTab === 'Signed Out' && (
          <>
            <Text style={s.sectionTitle}>Recently signed out</Text>
            {filteredSignedOut.length === 0 ? (
              <View style={s.emptyCard}><Text style={s.emptyText}>No sign-outs recorded today</Text></View>
            ) : (
              filteredSignedOut.map(v => (
                <View key={v.id || v._id} style={s.visitCard}>
                  <View style={[s.visitAvatar, { backgroundColor: '#f3f4f6' }]}>
                    <Text style={[s.visitAvatarTxt, { color: '#9ca3af' }]}>{(v.name || '?')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.visitName, { color: '#6b7280' }]}>{v.name || v.visitor_name}</Text>
                    <Text style={s.visitSub}>
                      {v.group || v.visitor_group} · in {fmtTime(v.sign_in_time || v.createdAt)} · out {fmtTime(v.sign_out_time)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* ── PRE-REGISTER ── */}
        {activeTab === 'Pre-register' && (
          <>
            <Text style={s.sectionTitle}>Pre-registered visitors</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Preregister')}
              style={s.addPreregBtn}
            >
              <UserPlus size={18} color="#fff" />
              <Text style={s.addPreregTxt}>Pre-register a visitor</Text>
            </TouchableOpacity>

            {expected.length === 0 ? (
              <View style={s.emptyCard}><Text style={s.emptyText}>No expected visitors</Text></View>
            ) : (
              expected.map(p => (
                <View key={p.id || p._id} style={s.visitCard}>
                  <View style={s.visitAvatar}>
                    <Text style={s.visitAvatarTxt}>{(p.name || 'V')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.visitName}>{p.name}</Text>
                    <Text style={s.visitSub}>Expected {fmtTime(p.expected_date)}</Text>
                  </View>
                  <View style={s.pendingBadge}><Text style={s.pendingBadgeTxt}>Expected</Text></View>
                </View>
              ))
            )}
          </>
        )}

      </ScrollView>

      {/* Sign-out confirmation modal */}
      {signOutTarget && (
        <SignOutModal
          visitor={signOutTarget}
          onCancel={() => setSignOutTarget(null)}
          onConfirm={handleSignOutVisitor}
          loading={signingOutVisitor}
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f3f4f6' },
  centered:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  shieldIcon:       { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2b4594', alignItems: 'center', justifyContent: 'center' },
  headerTitle:      { fontSize: 16, fontWeight: '700', color: '#111827' },
  headerSub:        { fontSize: 12, color: '#6b7280' },
  refreshBtn:       { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  guardCard:        { backgroundColor: '#fff', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  guardSignedRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  guardStatus:      { fontSize: 15, fontWeight: '700', color: '#111827' },
  guardSub:         { fontSize: 13, color: '#6b7280', marginTop: 1 },
  guardSignOutBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#fca5a5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  guardSignOutTxt:  { fontSize: 14, fontWeight: '600', color: '#ef4444' },
  guardSignInBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2b4594', borderRadius: 12, paddingVertical: 12 },
  guardSignInTxt:   { fontSize: 15, fontWeight: '700', color: '#fff' },
  sitePickerBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#f9fafb' },
  sitePickerText:   { fontSize: 15, color: '#111827', fontWeight: '500' },
  siteDropdown:     { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, marginTop: 4, backgroundColor: '#fff', overflow: 'hidden', position: 'absolute', left: 16, right: 16, top: 54, zIndex: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  siteOption:       { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  siteOptionTxt:    { fontSize: 15, color: '#111827' },
  tabBar:           { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tab:              { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 4 },
  tabActive:        { borderBottomWidth: 2, borderBottomColor: '#2b4594' },
  tabText:          { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  tabTextActive:    { color: '#2b4594', fontWeight: '700' },
  tabBadge:         { backgroundColor: '#ef4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeTxt:      { fontSize: 11, fontWeight: '700', color: '#fff' },
  searchRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  searchInput:      { flex: 1, fontSize: 15, color: '#111827' },
  sectionTitle:     { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  visitCard:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#f3f4f6' },
  visitAvatar:      { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  visitAvatarTxt:   { fontSize: 18, fontWeight: '700', color: '#6b7280' },
  visitName:        { fontSize: 15, fontWeight: '600', color: '#111827' },
  visitSub:         { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  signOutChip:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#fca5a5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  signOutChipTxt:   { fontSize: 12, fontWeight: '600', color: '#ef4444' },
  emptyCard:        { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
  emptyText:        { color: '#9ca3af', fontSize: 14 },
  pendingBadge:     { backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pendingBadgeTxt:  { fontSize: 12, fontWeight: '600', color: '#92400e' },
  addPreregBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2b4594', borderRadius: 12, paddingVertical: 13, marginBottom: 16 },
  addPreregTxt:     { fontSize: 15, fontWeight: '700', color: '#fff' },
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard:        { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%' },
  modalTitle:       { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 10 },
  modalBody:        { fontSize: 15, color: '#6b7280', lineHeight: 22, marginBottom: 24 },
  modalBtns:        { flexDirection: 'row', justifyContent: 'flex-end', gap: 20 },
  modalCancelBtn:   { paddingVertical: 10, paddingHorizontal: 16 },
  modalCancelTxt:   { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  modalConfirmBtn:  { backgroundColor: '#ef4444', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, minWidth: 90, alignItems: 'center' },
  modalConfirmTxt:  { fontSize: 15, fontWeight: '700', color: '#fff' },
});

export default SecurityGuardScreen;
