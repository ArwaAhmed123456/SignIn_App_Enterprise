/**
 * ManagerScreen.js
 * Role: Manager
 * - Notified when visitor arrives
 * - Sees who is present on site
 * - Sees who visits them
 * - Pre-registered visitor notifications
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Bell, RefreshCw, ChevronDown, Users, User, CheckCircle, Clock } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const fmtTime = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  } catch { return ''; }
};

const fmtDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch { return ''; }
};

const TABS = ['Overview', 'On Site', 'Expected', 'Notifications'];

const ManagerScreen = ({ navigation }) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab]   = useState('Overview');
  const [sites, setSites]           = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [siteOpen, setSiteOpen]     = useState(false);
  const [onSite, setOnSite]         = useState([]);
  const [expected, setExpected]     = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts]         = useState({ total: 0, visitors: 0, employees: 0, deliveries: 0 });
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifOn, setNotifOn]       = useState(true);

  const managerName = user?.name || user?.firstName || 'Manager';

  const load = useCallback(async () => {
    try {
      const sitesRes = await api.get('/projects');
      const siteList = sitesRes.data || [];
      setSites(siteList);
      const site = selectedSite || siteList[0] || null;
      if (site && !selectedSite) setSelectedSite(site);

      if (site) {
        const [visitsRes, preregRes, statsRes] = await Promise.all([
          api.get(`/visits?site_id=${site.id}&status=signed_in&limit=50`).catch(() => ({ data: [] })),
          api.get(`/pre-registrations?site_id=${site.id}&status=Pending`).catch(() => ({ data: [] })),
          api.get(`/visits/stats?site_id=${site.id}`).catch(() => ({ data: {} })),
        ]);

        const visits = (visitsRes.data?.visits || visitsRes.data || []);
        setOnSite(visits);
        setExpected(preregRes.data || []);

        const stats = statsRes.data;
        setCounts({
          total:     stats.totalIn      || visits.length || 0,
          visitors:  stats.visitorsIn   || 0,
          employees: stats.employeesIn  || 0,
          deliveries: stats.deliveriesIn || 0,
        });

        // Build notification feed from recent sign-ins
        const notifFeed = visits.slice(0, 10).map(v => ({
          id: v.id || v._id,
          type: 'arrived',
          name: v.name || v.visitor_name || 'Unknown',
          group: v.group || v.visitor_group || 'Visitor',
          time: fmtTime(v.sign_in_time || v.createdAt),
          date: fmtDate(v.sign_in_time || v.createdAt),
        }));
        setNotifications(notifFeed);
      }
    } catch (err) {
      console.log('ManagerScreen load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSite]);

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

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
        <View>
          <Text style={s.headerTitle}>Manager Dashboard</Text>
          <Text style={s.headerSub}>{managerName}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setNotifOn(v => !v)}
          style={[s.notifBtn, notifOn && s.notifBtnActive]}
        >
          <Bell size={20} color={notifOn ? '#fff' : '#6b7280'} />
        </TouchableOpacity>
      </View>

      {/* Site picker */}
      <View style={s.sitePicker}>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={{ paddingHorizontal: 12 }}>
        {TABS.map(t => (
          <TouchableOpacity key={t} onPress={() => setActiveTab(t)}
            style={[s.tab, activeTab === t && s.tabActive]}>
            <Text style={[s.tabText, activeTab === t && s.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ade80" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >

        {/* ── OVERVIEW ── */}
        {activeTab === 'Overview' && (
          <>
            {/* Count cards */}
            <View style={s.countGrid}>
              {[
                { label: 'Total on site', val: counts.total,     color: '#2b4594' },
                { label: 'Visitors',      val: counts.visitors,   color: '#0891b2' },
                { label: 'Employees',     val: counts.employees,  color: '#16a34a' },
                { label: 'Deliveries',    val: counts.deliveries, color: '#d97706' },
              ].map(({ label, val, color }) => (
                <View key={label} style={[s.countCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
                  <Text style={[s.countVal, { color }]}>{val}</Text>
                  <Text style={s.countLabel}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Expected today */}
            <Text style={s.sectionTitle}>Expected today</Text>
            {expected.length === 0 ? (
              <View style={s.emptyCard}><Text style={s.emptyText}>No expected visitors today</Text></View>
            ) : (
              expected.slice(0, 3).map(p => (
                <View key={p.id || p._id} style={s.visitCard}>
                  <View style={s.visitAvatar}><Text style={s.visitAvatarTxt}>{(p.name||'V')[0].toUpperCase()}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.visitName}>{p.name}</Text>
                    <Text style={s.visitSub}>{fmtTime(p.expected_date)} · {selectedSite?.name}</Text>
                  </View>
                  <View style={s.pendingBadge}><Text style={s.pendingBadgeTxt}>Expected</Text></View>
                </View>
              ))
            )}

            {/* Recent arrivals */}
            <Text style={[s.sectionTitle, { marginTop: 20 }]}>Recent arrivals</Text>
            {onSite.length === 0 ? (
              <View style={s.emptyCard}><Text style={s.emptyText}>No one currently signed in</Text></View>
            ) : (
              onSite.slice(0, 5).map(v => (
                <View key={v.id || v._id} style={s.visitCard}>
                  <View style={[s.visitAvatar, { backgroundColor: '#dcfce7' }]}>
                    <Text style={[s.visitAvatarTxt, { color: '#16a34a' }]}>{(v.name||'V')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.visitName}>{v.name || v.visitor_name}</Text>
                    <Text style={s.visitSub}>{v.group || v.visitor_group} · signed in {fmtTime(v.sign_in_time || v.createdAt)}</Text>
                  </View>
                  <CheckCircle size={18} color="#4ade80" />
                </View>
              ))
            )}
          </>
        )}

        {/* ── ON SITE ── */}
        {activeTab === 'On Site' && (
          <>
            <View style={s.onSiteHeader}>
              <Text style={s.sectionTitle}>{counts.total} people on site</Text>
              <TouchableOpacity onPress={load}><RefreshCw size={18} color="#9ca3af" /></TouchableOpacity>
            </View>
            {onSite.length === 0 ? (
              <View style={s.emptyCard}><Text style={s.emptyText}>Nobody signed in right now</Text></View>
            ) : (
              onSite.map(v => (
                <View key={v.id || v._id} style={s.visitCard}>
                  <View style={[s.visitAvatar, { backgroundColor: '#dcfce7' }]}>
                    <Text style={[s.visitAvatarTxt, { color: '#16a34a' }]}>{(v.name||'?')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.visitName}>{v.name || v.visitor_name}</Text>
                    <Text style={s.visitSub}>{v.group || v.visitor_group} · {fmtTime(v.sign_in_time || v.createdAt)}</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* ── EXPECTED ── */}
        {activeTab === 'Expected' && (
          <>
            <Text style={s.sectionTitle}>Pre-registered visitors</Text>
            {expected.length === 0 ? (
              <View style={s.emptyCard}><Text style={s.emptyText}>No expected visitors</Text></View>
            ) : (
              expected.map(p => (
                <View key={p.id || p._id} style={s.visitCard}>
                  <View style={s.visitAvatar}>
                    <Text style={s.visitAvatarTxt}>{(p.name||'V')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.visitName}>{p.name}</Text>
                    <Text style={s.visitSub}>{fmtDate(p.expected_date)} at {fmtTime(p.expected_date)}</Text>
                    {p.notes ? <Text style={s.visitNote}>{p.notes}</Text> : null}
                  </View>
                  <View style={s.pendingBadge}><Text style={s.pendingBadgeTxt}>Pending</Text></View>
                </View>
              ))
            )}
          </>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === 'Notifications' && (
          <>
            <View style={s.notifSettingsRow}>
              <Text style={s.sectionTitle}>Visitor notifications</Text>
              <TouchableOpacity
                onPress={() => setNotifOn(v => !v)}
                style={[s.togglePill, notifOn && s.togglePillOn]}
              >
                <Text style={{ color: notifOn ? '#fff' : '#6b7280', fontSize: 13, fontWeight: '600' }}>
                  {notifOn ? 'On' : 'Off'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={s.notifDesc}>You will be notified when a visitor selects you as their host when signing in.</Text>

            {notifications.length === 0 ? (
              <View style={s.emptyCard}><Text style={s.emptyText}>No notifications yet</Text></View>
            ) : (
              notifications.map(n => (
                <View key={n.id} style={s.notifCard}>
                  <View style={[s.visitAvatar, { backgroundColor: '#eff6ff' }]}>
                    <Text style={[s.visitAvatarTxt, { color: '#2b4594' }]}>{n.name[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.visitName}><Text style={{ fontWeight: '700' }}>{n.name}</Text> arrived</Text>
                    <Text style={s.visitSub}>{n.group} · {n.time}</Text>
                  </View>
                  <Bell size={16} color="#9ca3af" />
                </View>
              ))
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f3f4f6' },
  centered:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle:      { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerSub:        { fontSize: 13, color: '#6b7280', marginTop: 1 },
  notifBtn:         { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  notifBtnActive:   { backgroundColor: '#2b4594', borderColor: '#2b4594' },
  sitePicker:       { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', zIndex: 10 },
  sitePickerBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#f9fafb' },
  sitePickerText:   { fontSize: 15, color: '#111827', fontWeight: '500' },
  siteDropdown:     { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, marginTop: 4, backgroundColor: '#fff', overflow: 'hidden', position: 'absolute', left: 16, right: 16, top: 54, zIndex: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  siteOption:       { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  siteOptionTxt:    { fontSize: 15, color: '#111827' },
  tabBar:           { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', maxHeight: 48, flexGrow: 0 },
  tab:              { paddingHorizontal: 16, paddingVertical: 12, marginRight: 4 },
  tabActive:        { borderBottomWidth: 2, borderBottomColor: '#2b4594' },
  tabText:          { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  tabTextActive:    { color: '#2b4594', fontWeight: '700' },
  countGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  countCard:        { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f3f4f6' },
  countVal:         { fontSize: 28, fontWeight: '700', marginBottom: 2 },
  countLabel:       { fontSize: 12, color: '#6b7280' },
  sectionTitle:     { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 10 },
  onSiteHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  visitCard:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#f3f4f6' },
  visitAvatar:      { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  visitAvatarTxt:   { fontSize: 18, fontWeight: '700', color: '#6b7280' },
  visitName:        { fontSize: 15, fontWeight: '600', color: '#111827' },
  visitSub:         { fontSize: 13, color: '#9ca3af', marginTop: 1 },
  visitNote:        { fontSize: 12, color: '#6b7280', marginTop: 2, fontStyle: 'italic' },
  pendingBadge:     { backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pendingBadgeTxt:  { fontSize: 12, fontWeight: '600', color: '#92400e' },
  emptyCard:        { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
  emptyText:        { color: '#9ca3af', fontSize: 14 },
  notifSettingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  notifDesc:        { fontSize: 13, color: '#6b7280', marginBottom: 16, lineHeight: 18 },
  notifCard:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#f3f4f6' },
  togglePill:       { backgroundColor: '#e5e7eb', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  togglePillOn:     { backgroundColor: '#2b4594' },
});

export default ManagerScreen;
