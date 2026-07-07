import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Bell, CheckCircle, ChevronDown, RefreshCw, Users } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import {
  getAccessibleSites,
  getPreRegistrations,
  getVisits,
  getVisitStats,
} from '../services/enterprisePortal';

const TABS = ['Overview', 'On Site', 'Signed Out', 'Notifications'];

const fmtTime = (value) => {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
  } catch {
    return value;
  }
  return String(value).slice(0, 5);
};

const fmtDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
};

const ManagerScreen = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [siteOpen, setSiteOpen] = useState(false);
  const [onSite, setOnSite] = useState([]);
  const [signedOut, setSignedOut] = useState([]);
  const [expected, setExpected] = useState([]);
  const [counts, setCounts] = useState({ total: 0, visitors: 0, employees: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifOn, setNotifOn] = useState(true);

  const managerName = user?.name || user?.firstName || 'Manager';

  const loadSiteData = useCallback(async (siteIdOverride) => {
    const siteId = siteIdOverride || selectedSite?.id;
    if (!siteId) return;

    const [currentVisits, signedOutVisits, preRegistered, stats] = await Promise.all([
      getVisits({ siteId, status: 'In' }).catch(() => []),
      getVisits({ siteId, status: 'Out' }).catch(() => []),
      getPreRegistrations({ siteId, status: 'Pending' }).catch(() => []),
      getVisitStats(siteId).catch(() => ({ totalIn: 0, visitorsIn: 0, employeesIn: 0 })),
    ]);

    setOnSite(currentVisits);
    setSignedOut(signedOutVisits);
    setExpected(preRegistered);
    setCounts({
      total: stats.totalIn || currentVisits.length,
      visitors: stats.visitorsIn || currentVisits.filter((visit) => !String(visit.group).toLowerCase().includes('employee')).length,
      employees: stats.employeesIn || currentVisits.filter((visit) => String(visit.group).toLowerCase().includes('employee')).length,
    });
  }, [selectedSite]);

  const load = useCallback(async () => {
    try {
      const siteList = await getAccessibleSites(user?.project_id);
      setSites(siteList);

      let resolvedSite = selectedSite;
      if (!resolvedSite && siteList.length) {
        resolvedSite = siteList[0];
        setSelectedSite(siteList[0]);
      }

      if (resolvedSite?.id) {
        await loadSiteData(resolvedSite.id);
      }
    } catch (error) {
      console.log('ManagerScreen load error:', error?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadSiteData, selectedSite, user?.project_id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const notifications = useMemo(
    () =>
      [...onSite, ...signedOut]
        .filter((visit) => visit.pre_registered && visit.checked_in_by_guard)
        .sort((a, b) => new Date(b.sign_in_time || 0) - new Date(a.sign_in_time || 0))
        .slice(0, 20),
    [onSite, signedOut],
  );

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#2b4594" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Manager portal</Text>
          <Text style={s.headerSub}>{managerName}</Text>
        </View>
        <TouchableOpacity onPress={() => setNotifOn((value) => !value)} style={[s.notifBtn, notifOn && s.notifBtnActive]}>
          <Bell size={20} color={notifOn ? '#fff' : '#6b7280'} />
        </TouchableOpacity>
      </View>

      <View style={s.sitePicker}>
        <TouchableOpacity onPress={() => setSiteOpen((value) => !value)} style={s.sitePickerBtn}>
          <Text style={s.sitePickerText}>{selectedSite?.name || 'Select site'}</Text>
          <ChevronDown size={16} color="#6b7280" />
        </TouchableOpacity>
        {siteOpen && (
          <View style={s.siteDropdown}>
            {sites.map((site) => (
              <TouchableOpacity
                key={site.id}
                onPress={async () => {
                  setSelectedSite(site);
                  setSiteOpen(false);
                  setRefreshing(true);
                  await loadSiteData(site.id);
                  setRefreshing(false);
                }}
                style={s.siteOption}
              >
                <Text style={[s.siteOptionTxt, selectedSite?.id === site.id && s.siteOptionTxtActive]}>{site.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={s.tabBarContent}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[s.tab, activeTab === tab && s.tabActive]}>
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2b4594" />}
        contentContainerStyle={s.scrollContent}
      >
        {activeTab === 'Overview' && (
          <>
            <View style={s.countGrid}>
              {[
                { label: 'On site now', value: counts.total, color: '#2b4594' },
                { label: 'Visitors', value: counts.visitors, color: '#0891b2' },
                { label: 'Employees', value: counts.employees, color: '#16a34a' },
              ].map((item) => (
                <View key={item.label} style={[s.countCard, { borderLeftColor: item.color }]}>
                  <Text style={[s.countVal, { color: item.color }]}>{item.value}</Text>
                  <Text style={s.countLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            <Text style={s.sectionTitle}>Expected visitors</Text>
            {expected.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>No pending pre-registrations for this site.</Text>
              </View>
            ) : (
              expected.slice(0, 4).map((item) => (
                <View key={item.id} style={s.visitCard}>
                  <View style={s.visitAvatar}>
                    <Text style={s.visitAvatarTxt}>{item.name[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={s.visitMeta}>
                    <Text style={s.visitName}>{item.name}</Text>
                    <Text style={s.visitSub}>{fmtDate(item.expected_date)} at {fmtTime(item.expected_date)}</Text>
                    {item.notes ? <Text style={s.visitNote}>{item.notes}</Text> : null}
                  </View>
                  <View style={s.pendingBadge}>
                    <Text style={s.pendingBadgeTxt}>Pending</Text>
                  </View>
                </View>
              ))
            )}

            <Text style={[s.sectionTitle, s.sectionTopSpacing]}>Recent sign-ins</Text>
            {onSite.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>Nobody is currently signed in.</Text>
              </View>
            ) : (
              onSite.slice(0, 5).map((visit) => (
                <View key={visit.id} style={s.visitCard}>
                  <View style={[s.visitAvatar, s.visitAvatarActive]}>
                    <Text style={[s.visitAvatarTxt, s.visitAvatarTxtActive]}>{visit.name[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={s.visitMeta}>
                    <Text style={s.visitName}>{visit.name}</Text>
                    <Text style={s.visitSub}>{visit.group} · signed in {fmtTime(visit.sign_in_time)}</Text>
                  </View>
                  <CheckCircle size={18} color="#16a34a" />
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'On Site' && (
          <>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>{onSite.length} currently signed in</Text>
              <TouchableOpacity onPress={load}>
                <RefreshCw size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            {onSite.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>Nobody is on site right now.</Text>
              </View>
            ) : (
              onSite.map((visit) => (
                <View key={visit.id} style={s.visitCard}>
                  <View style={[s.visitAvatar, s.visitAvatarActive]}>
                    <Text style={[s.visitAvatarTxt, s.visitAvatarTxtActive]}>{visit.name[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={s.visitMeta}>
                    <Text style={s.visitName}>{visit.name}</Text>
                    <Text style={s.visitSub}>{visit.group} · in {fmtTime(visit.sign_in_time)}</Text>
                    {visit.pre_registered && visit.checked_in_by_guard ? (
                      <Text style={s.visitNote}>Pre-registered visitor checked in by security</Text>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'Signed Out' && (
          <>
            <Text style={s.sectionTitle}>Signed out today</Text>
            {signedOut.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>No sign-outs recorded yet.</Text>
              </View>
            ) : (
              signedOut.map((visit) => (
                <View key={visit.id} style={s.visitCard}>
                  <View style={s.visitAvatar}>
                    <Text style={s.visitAvatarTxt}>{visit.name[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={s.visitMeta}>
                    <Text style={s.visitName}>{visit.name}</Text>
                    <Text style={s.visitSub}>
                      {visit.group} · in {fmtTime(visit.sign_in_time)} · out {fmtTime(visit.sign_out_time)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'Notifications' && (
          <>
            <View style={s.notifSettingsRow}>
              <Text style={s.sectionTitle}>Guard arrival notifications</Text>
              <TouchableOpacity onPress={() => setNotifOn((value) => !value)} style={[s.togglePill, notifOn && s.togglePillOn]}>
                <Text style={notifOn ? s.toggleTextOn : s.toggleTextOff}>{notifOn ? 'On' : 'Off'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.notifDesc}>Notifications list visitors who were pre-registered and then checked in by security.</Text>

            {notifications.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>No pre-registered guard arrivals yet.</Text>
              </View>
            ) : (
              notifications.map((item) => (
                <View key={item.id} style={s.notifCard}>
                  <View style={[s.visitAvatar, s.notifAvatar]}>
                    <Text style={[s.visitAvatarTxt, s.notifAvatarTxt]}>{item.name[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={s.visitMeta}>
                    <Text style={s.visitName}>{item.name} arrived</Text>
                    <Text style={s.visitSub}>
                      {item.group} · {fmtDate(item.sign_in_time)} · {fmtTime(item.sign_in_time)}
                    </Text>
                    <Text style={s.visitNote}>Checked in by {item.checked_in_by || 'security guard'}</Text>
                  </View>
                  <Bell size={16} color="#2b4594" />
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
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  notifBtnActive: { backgroundColor: '#2b4594', borderColor: '#2b4594' },
  sitePicker: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    zIndex: 10,
  },
  sitePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
  },
  sitePickerText: { fontSize: 15, color: '#111827', fontWeight: '500' },
  siteDropdown: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 54,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 20,
    elevation: 5,
  },
  siteOption: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  siteOptionTxt: { fontSize: 15, color: '#111827' },
  siteOptionTxtActive: { color: '#2b4594', fontWeight: '700' },
  tabBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', maxHeight: 48, flexGrow: 0 },
  tabBarContent: { paddingHorizontal: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 12, marginRight: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2b4594' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  tabTextActive: { color: '#2b4594', fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  countGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  countCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderLeftWidth: 4,
  },
  countVal: { fontSize: 28, fontWeight: '700', marginBottom: 2 },
  countLabel: { fontSize: 12, color: '#6b7280' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 10 },
  sectionTopSpacing: { marginTop: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  visitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  visitAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitAvatarActive: { backgroundColor: '#dcfce7' },
  visitAvatarTxt: { fontSize: 18, fontWeight: '700', color: '#6b7280' },
  visitAvatarTxtActive: { color: '#16a34a' },
  visitMeta: { flex: 1 },
  visitName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  visitSub: { fontSize: 13, color: '#9ca3af', marginTop: 1 },
  visitNote: { fontSize: 12, color: '#2b4594', marginTop: 3 },
  pendingBadge: { backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pendingBadgeTxt: { fontSize: 12, fontWeight: '600', color: '#92400e' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  emptyText: { color: '#9ca3af', fontSize: 14, textAlign: 'center' },
  notifSettingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  notifDesc: { fontSize: 13, color: '#6b7280', marginBottom: 16, lineHeight: 18 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  notifAvatar: { backgroundColor: '#eff6ff' },
  notifAvatarTxt: { color: '#2b4594' },
  togglePill: { backgroundColor: '#e5e7eb', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  togglePillOn: { backgroundColor: '#2b4594' },
  toggleTextOn: { color: '#fff', fontSize: 13, fontWeight: '600' },
  toggleTextOff: { color: '#6b7280', fontSize: 13, fontWeight: '600' },
});

export default ManagerScreen;
