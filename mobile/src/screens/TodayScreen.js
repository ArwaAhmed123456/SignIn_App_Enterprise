import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, ChevronDown, RefreshCw, LogIn } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const fmtTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};
const today = new Date();
const todayStr = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const TodayScreen = ({ navigation }) => {
  const { user } = useAuth();

  // Sign-in status
  const [signedIn, setSignedIn]     = useState(false);
  const [signInTime, setSignInTime] = useState('');
  const [signOutTime, setSignOutTime] = useState('');
  const [currentVisitId, setCurrentVisitId] = useState(null);

  // Site + activity
  const [sites, setSites]           = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [siteOpen, setSiteOpen]     = useState(false);
  const [counts, setCounts]         = useState({ all: 0, visitors: 0, employees: 0 });
  const [expected, setExpected]     = useState([]);
  const [schedule, setSchedule]     = useState({ worked: 0, total: 0 });
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const memberName = user?.name || user?.firstName || 'Member';

  const load = useCallback(async () => {
    try {
      const sitesRes = await api.get('/projects');
      const siteList = sitesRes.data || [];
      setSites(siteList);
      const site = selectedSite || siteList[0] || null;
      if (site && !selectedSite) setSelectedSite(site);

      if (site) {
        const [statsRes, preregRes] = await Promise.all([
          api.get(`/visits/stats?site_id=${site.id}`).catch(() => ({ data: { totalIn: 0, groupCounts: [] } })),
          api.get(`/pre-registrations?site_id=${site.id}`).catch(() => ({ data: [] })),
        ]);
        const stats = statsRes.data;
        const gc = stats.groupCounts || [];
        const empCount = gc.filter(g => ['employee','employees'].includes((g.group||'').toLowerCase())).reduce((s,g) => s+g.count, 0);
        const visCount = (stats.totalIn || 0) - empCount;
        setCounts({ all: stats.totalIn || 0, visitors: visCount, employees: empCount });
        setExpected((preregRes.data || []).filter(p => p.status === 'Pending').slice(0, 5));
      }

      // Weekly schedule
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      const dateFrom = weekStart.toISOString().split('T')[0];
      const dateTo   = today.toISOString().split('T')[0];
      const attRes = await api.get(`/attendance/timesheets?date_from=${dateFrom}&date_to=${dateTo}`).catch(() => ({ data: { rows: [] } }));
      const rows = attRes.data?.rows || [];
      const myRow = rows.find(r => r.name?.toLowerCase() === memberName.toLowerCase());
      setSchedule({ worked: myRow?.total_hours || 0, total: 40 });
    } catch (err) {
      console.log('TodayScreen load error:', err.message);
    } finally { setLoading(false); setRefreshing(false); }
  }, [selectedSite, memberName]);

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const fmtHours = (h) => {
    if (!h) return '0m';
    const hrs  = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#2b4594" /></View>;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.logo}>
          <View style={[s.logoDot, { backgroundColor: '#2b4594', marginRight: -10, zIndex: 1 }]} />
          <View style={[s.logoDot, { backgroundColor: '#1e326e', opacity: 0.85 }]} />
        </View>
        <TouchableOpacity onPress={() => setShowActions(v => !v)} style={s.plusBtn}>
          <Plus size={22} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {/* Action sheet */}
      {showActions && (
        <View style={s.actionSheet}>
          <TouchableOpacity onPress={() => { setShowActions(false); navigation.navigate('Preregister'); }} style={s.actionItem}>
            <Text style={s.actionIcon}>👤</Text>
            <Text style={s.actionText}>Preregister a Visitor</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setShowActions(false); navigation.navigate('QRCode'); }} style={s.actionItem}>
            <Text style={s.actionIcon}>⬜</Text>
            <Text style={s.actionText}>My QR code</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2b4594" />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Date */}
        <Text style={s.dateHeader}>☀️  {todayStr}</Text>

        {/* Sign-in status card */}
        <View style={s.card}>
          <View style={s.avatarRow}>
            <View style={s.avatar}>
              {signedIn && <View style={s.onlineDot} />}
            </View>
          </View>
          {signedIn ? (
            <>
              <Text style={s.signedInText}>Signed in to {selectedSite?.name} {signInTime}</Text>
              <TouchableOpacity
                onPress={async () => {
                  if (currentVisitId) await api.post(`/visits/public/${currentVisitId}/sign-out`).catch(() => {});
                  setSignedIn(false); setSignOutTime(fmtTime(new Date())); setCurrentVisitId(null); load();
                }}
                style={s.signOutBtn} activeOpacity={0.8}
              >
                <Text style={s.signOutIcon}>↪</Text>
                <Text style={s.signOutText}>Tap to sign out</Text>
              </TouchableOpacity>
            </>
          ) : signOutTime ? (
            <>
              <Text style={s.signedOutText}>Signed out {signOutTime}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignInFlow')} style={s.signInBtn} activeOpacity={0.8}>
                <Text style={s.signInBtnText}>🟢  Sign in to {selectedSite?.name || 'site'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.notSignedText}>You have not signed in today</Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignInFlow')} style={s.signInBtn} activeOpacity={0.8}>
                <Text style={s.signInBtnText}>🟢  Sign in to {selectedSite?.name || 'site'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Activity section */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Activity</Text>
          <TouchableOpacity onPress={load}><RefreshCw size={18} color="#9ca3af" /></TouchableOpacity>
        </View>

        {/* Site picker */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <TouchableOpacity onPress={() => setSiteOpen(v => !v)} style={s.sitePicker}>
            <Text style={s.sitePickerText}>{selectedSite?.name || 'Select site'}</Text>
            <ChevronDown size={18} color="#6b7280" />
          </TouchableOpacity>
          {siteOpen && (
            <View style={s.siteDropdown}>
              {sites.map(site => (
                <TouchableOpacity key={site.id} onPress={() => { setSelectedSite(site); setSiteOpen(false); load(); }} style={s.siteOption}>
                  <Text style={[s.siteOptionText, selectedSite?.id === site.id && { color: '#2b4594', fontWeight: '700' }]}>{site.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Counters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, marginBottom: 16 }}>
          {[['All', counts.all], ['Visitors', counts.visitors], ['Employees', counts.employees]].map(([label, val]) => (
            <View key={label} style={s.counterCard}>
              <Text style={s.counterVal}>{val}</Text>
              <Text style={s.counterLabel}>{label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Expected Visitors */}
        <Text style={[s.sectionTitle, { paddingHorizontal: 16, marginBottom: 8 }]}>Expected Visitors</Text>
        {expected.length > 0 ? expected.map(p => (
          <View key={p.id} style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
            <View style={s.expAvatar}><Text style={s.expAvatarText}>{(p.name||'V')[0].toUpperCase()}</Text></View>
            <View>
              <Text style={s.expName}>{p.name}</Text>
              <Text style={s.expSite}>{selectedSite?.name}</Text>
              <Text style={s.expTime}>{fmtTime(p.expected_date)}</Text>
            </View>
          </View>
        )) : null}
        <TouchableOpacity onPress={() => navigation.navigate('Preregister')} style={[s.outlineBtn, { marginHorizontal: 16, marginBottom: 20 }]}>
          <Text style={s.outlineBtnText}>Preregister Visitor</Text>
        </TouchableOpacity>

        {/* My Schedule */}
        <Text style={[s.sectionTitle, { paddingHorizontal: 16, marginBottom: 8 }]}>My Schedule</Text>
        <View style={[s.card, { marginHorizontal: 16 }]}>
          <View style={s.scheduleRow}>
            <Text style={s.scheduleLabel}>This week</Text>
            <TouchableOpacity><Text style={s.detailsLink}>Details &gt;</Text></TouchableOpacity>
          </View>
          <Text style={s.scheduleHours}>{fmtHours(schedule.worked)} of {fmtHours(schedule.total)} this week</Text>
          <View style={s.progressTrack}>
            <View style={[s.progressBar, { width: `${Math.min(100, (schedule.worked / (schedule.total || 40)) * 100)}%` }]} />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f3f4f6' },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  logo:           { flexDirection: 'row', alignItems: 'center' },
  logoDot:        { width: 36, height: 36, borderRadius: 18 },
  plusBtn:        { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  actionSheet:    { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 4, borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden', zIndex: 20 },
  actionItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  actionIcon:     { fontSize: 18 },
  actionText:     { fontSize: 15, color: '#111827', fontWeight: '500' },
  dateHeader:     { fontSize: 16, fontWeight: '600', color: '#374151', paddingHorizontal: 16, paddingVertical: 12 },
  card:           { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  avatarRow:      { alignItems: 'center', marginBottom: 10 },
  avatar:         { width: 64, height: 64, borderRadius: 32, backgroundColor: '#e5e7eb', position: 'relative' },
  onlineDot:      { position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#2b4594', borderWidth: 2, borderColor: '#fff' },
  notSignedText:  { fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 12 },
  signedInText:   { fontSize: 15, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 14 },
  signedOutText:  { fontSize: 15, fontWeight: '700', color: '#6b7280', textAlign: 'center', marginBottom: 14 },
  signInBtn:      { backgroundColor: '#2b4594', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  signInBtnText:  { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  signOutBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingVertical: 14 },
  signOutIcon:    { fontSize: 18, color: '#ef4444' },
  signOutText:    { fontSize: 15, fontWeight: '600', color: '#111827' },
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 8, marginBottom: 10 },
  sectionTitle:   { fontSize: 18, fontWeight: '700', color: '#111827' },
  sitePicker:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff' },
  sitePickerText: { fontSize: 15, color: '#111827', fontWeight: '500' },
  siteDropdown:   { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, marginTop: 4, backgroundColor: '#fff', overflow: 'hidden' },
  siteOption:     { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  siteOptionText: { fontSize: 15, color: '#111827' },
  counterCard:    { backgroundColor: '#fff', borderRadius: 12, padding: 16, minWidth: 90, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
  counterVal:     { fontSize: 24, fontWeight: '700', color: '#111827' },
  counterLabel:   { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  expAvatar:      { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  expAvatarText:  { fontSize: 18, fontWeight: '700', color: '#6b7280' },
  expName:        { fontSize: 15, fontWeight: '700', color: '#111827' },
  expSite:        { fontSize: 13, color: '#9ca3af' },
  expTime:        { fontSize: 13, color: '#9ca3af' },
  outlineBtn:     { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, paddingVertical: 16, alignItems: 'center', backgroundColor: '#fff' },
  outlineBtnText: { fontSize: 16, fontWeight: '600', color: '#111827' },
  scheduleRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  scheduleLabel:  { fontSize: 16, fontWeight: '700', color: '#111827' },
  detailsLink:    { fontSize: 14, color: '#9ca3af' },
  scheduleHours:  { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  progressTrack:  { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2 },
  progressBar:    { height: 4, backgroundColor: '#2b4594', borderRadius: 2 },
});

export default TodayScreen;
