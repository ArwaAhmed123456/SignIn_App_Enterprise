import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronDown, LogIn, LogOut, RefreshCw, Search, ShieldCheck, UserPlus, X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import {
  getAccessibleSites,
  getPreRegistrations,
  getVisits,
  getVisitorGroups,
  markPreRegisteredArrival,
  signInVisitor,
  signOutVisit,
} from '../services/enterprisePortal';

const TABS = ['On Site', 'Signed Out', 'Pre-register'];

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

const CheckInModal = ({
  visible,
  onClose,
  onSubmit,
  loading,
  visitorGroups,
  defaultGroup,
}) => {
  const [name, setName] = useState('');
  const [group, setGroup] = useState(defaultGroup || visitorGroups?.[0]?.name || 'Visitor');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible) {
      setName('');
      setNotes('');
      setGroup(defaultGroup || visitorGroups?.[0]?.name || 'Visitor');
    }
  }, [visible, defaultGroup, visitorGroups]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <Text style={s.modalTitle}>Sign in visitor or staff</Text>
          <Text style={s.modalBody}>Enter the person’s name, choose their group, then sign them in.</Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor="#9ca3af"
            style={s.input}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.groupPicker}>
            {visitorGroups.map((item) => {
              const groupName = item?.name || 'Visitor';
              const active = group === groupName;
              return (
                <TouchableOpacity
                  key={item.id || groupName}
                  onPress={() => setGroup(groupName)}
                  style={[s.groupChip, active && s.groupChipActive]}
                >
                  <Text style={[s.groupChipText, active && s.groupChipTextActive]}>{groupName}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional note"
            placeholderTextColor="#9ca3af"
            style={[s.input, s.notesInput]}
            multiline
          />

          <View style={s.modalBtns}>
            <TouchableOpacity onPress={onClose} style={s.modalCancelBtn}>
              <Text style={s.modalCancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (!name.trim()) {
                  Alert.alert('Name required', 'Please enter the visitor or staff name.');
                  return;
                }
                onSubmit({ name: name.trim(), group, notes: notes.trim() });
              }}
              disabled={loading}
              style={s.modalConfirmBtn}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.modalConfirmTxt}>Sign in</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const SecurityGuardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('On Site');
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [siteOpen, setSiteOpen] = useState(false);
  const [onSite, setOnSite] = useState([]);
  const [signedOut, setSignedOut] = useState([]);
  const [expected, setExpected] = useState([]);
  const [visitorGroups, setVisitorGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);
  const [signOutTarget, setSignOutTarget] = useState(null);
  const [signingOutVisitor, setSigningOutVisitor] = useState(false);
  const [arrivingId, setArrivingId] = useState(null);

  const guardName = user?.name || user?.firstName || 'Security guard';

  const loadSiteData = useCallback(async (siteIdOverride) => {
    const siteId = siteIdOverride || selectedSite?.id;
    if (!siteId) return;

    const [currentVisits, signedOutVisits, preRegistered, groups] = await Promise.all([
      getVisits({ siteId, status: 'In' }).catch(() => []),
      getVisits({ siteId, status: 'Out' }).catch(() => []),
      getPreRegistrations({ siteId, status: 'Pending' }).catch(() => []),
      getVisitorGroups(siteId).catch(() => []),
    ]);

    setOnSite(currentVisits);
    setSignedOut(signedOutVisits);
    setExpected(preRegistered);
    setVisitorGroups(groups);
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
      console.log('SecurityGuardScreen load error:', error?.message);
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

  const handleCheckIn = async ({ name, group, notes }) => {
    if (!selectedSite?.id) {
      Alert.alert('Site required', 'Please select a site before signing someone in.');
      return;
    }

    setSubmittingCheckIn(true);
    try {
      await signInVisitor({
        siteId: selectedSite.id,
        name,
        group,
        notes,
      });
      setCheckInOpen(false);
      await loadSiteData(selectedSite.id);
      setActiveTab('On Site');
    } catch (error) {
      Alert.alert('Sign-in failed', error?.response?.data?.error || 'Could not sign this person in.');
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  const handleSignOutVisitor = async () => {
    if (!signOutTarget?.id) return;
    setSigningOutVisitor(true);
    try {
      await signOutVisit(signOutTarget.id);
      setSignOutTarget(null);
      await loadSiteData(selectedSite?.id);
    } catch (error) {
      Alert.alert('Sign-out failed', error?.response?.data?.error || 'Could not sign this person out.');
    } finally {
      setSigningOutVisitor(false);
    }
  };

  const handleArrive = async (item) => {
    if (!item?.id) return;
    setArrivingId(item.id);
    try {
      await markPreRegisteredArrival(item.id);
      await loadSiteData(selectedSite?.id);
      setActiveTab('On Site');
    } catch (error) {
      Alert.alert('Arrival failed', error?.response?.data?.error || 'Could not mark this visitor as arrived.');
    } finally {
      setArrivingId(null);
    }
  };

  const filterItems = useCallback(
    (items) =>
      items.filter((item) => {
        if (!search.trim()) return true;
        const value = `${item?.name || ''} ${item?.group || ''}`.toLowerCase();
        return value.includes(search.trim().toLowerCase());
      }),
    [search],
  );

  const filteredOnSite = useMemo(() => filterItems(onSite), [filterItems, onSite]);
  const filteredSignedOut = useMemo(() => filterItems(signedOut), [filterItems, signedOut]);
  const filteredExpected = useMemo(() => filterItems(expected), [expected, filterItems]);

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
        <View style={s.headerLeft}>
          <View style={s.shieldIcon}>
            <ShieldCheck size={20} color="#fff" />
          </View>
          <View>
            <Text style={s.headerTitle}>Security portal</Text>
            <Text style={s.headerSub}>{guardName}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={load} style={s.refreshBtn}>
          <RefreshCw size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View style={s.actionCard}>
        <Text style={s.actionTitle}>Visitor control</Text>
        <Text style={s.actionSub}>Sign in visitors or staff, sign them out later, and pre-register arrivals.</Text>
        <View style={s.actionButtons}>
          <TouchableOpacity onPress={() => setCheckInOpen(true)} style={s.primaryBtn}>
            <LogIn size={17} color="#fff" />
            <Text style={s.primaryBtnText}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Preregister', { siteId: selectedSite?.id, siteName: selectedSite?.name })}
            style={s.secondaryBtn}
          >
            <UserPlus size={17} color="#2b4594" />
            <Text style={s.secondaryBtnText}>Pre-register</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.sitePickerWrap}>
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

      <View style={s.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[s.tab, activeTab === tab && s.tabActive]}>
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
            {tab === 'On Site' && filteredOnSite.length > 0 ? (
              <View style={s.tabBadge}>
                <Text style={s.tabBadgeTxt}>{filteredOnSite.length}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.searchRow}>
        <Search size={16} color="#9ca3af" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or group"
          placeholderTextColor="#9ca3af"
          style={s.searchInput}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={16} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2b4594" />}
        contentContainerStyle={s.scrollContent}
      >
        {activeTab === 'On Site' && (
          <>
            <Text style={s.sectionTitle}>{filteredOnSite.length} currently on site</Text>
            {filteredOnSite.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>Nobody is currently signed in.</Text>
              </View>
            ) : (
              filteredOnSite.map((visit) => (
                <View key={visit.id} style={s.visitCard}>
                  <View style={[s.visitAvatar, s.visitAvatarActive]}>
                    <Text style={[s.visitAvatarTxt, s.visitAvatarTxtActive]}>{visit.name[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={s.visitMeta}>
                    <Text style={s.visitName}>{visit.name}</Text>
                    <Text style={s.visitSub}>{visit.group} · in {fmtTime(visit.sign_in_time)}</Text>
                    {visit.pre_registered ? <Text style={s.visitNote}>Pre-registered arrival</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => setSignOutTarget(visit)} style={s.signOutChip}>
                    <LogOut size={14} color="#ef4444" />
                    <Text style={s.signOutChipTxt}>Sign out</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'Signed Out' && (
          <>
            <Text style={s.sectionTitle}>Recently signed out</Text>
            {filteredSignedOut.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>No one has signed out yet.</Text>
              </View>
            ) : (
              filteredSignedOut.map((visit) => (
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

        {activeTab === 'Pre-register' && (
          <>
            <Text style={s.sectionTitle}>Expected visitors</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Preregister', { siteId: selectedSite?.id, siteName: selectedSite?.name })}
              style={s.addPreregBtn}
            >
              <UserPlus size={18} color="#fff" />
              <Text style={s.addPreregTxt}>Create pre-registration</Text>
            </TouchableOpacity>

            {filteredExpected.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>No expected visitors right now.</Text>
              </View>
            ) : (
              filteredExpected.map((item) => (
                <View key={item.id} style={s.visitCard}>
                  <View style={s.visitAvatar}>
                    <Text style={s.visitAvatarTxt}>{item.name[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={s.visitMeta}>
                    <Text style={s.visitName}>{item.name}</Text>
                    <Text style={s.visitSub}>Expected at {fmtTime(item.expected_date)}</Text>
                    {item.notes ? <Text style={s.visitNote}>{item.notes}</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => handleArrive(item)} style={s.arriveBtn} disabled={arrivingId === item.id}>
                    {arrivingId === item.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <LogIn size={14} color="#fff" />
                        <Text style={s.arriveBtnTxt}>Arrived</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <CheckInModal
        visible={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        onSubmit={handleCheckIn}
        loading={submittingCheckIn}
        visitorGroups={visitorGroups.length ? visitorGroups : [{ id: 'visitor', name: 'Visitor' }]}
      />

      <Modal visible={Boolean(signOutTarget)} transparent animationType="fade" onRequestClose={() => setSignOutTarget(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Sign out {signOutTarget?.name}?</Text>
            <Text style={s.modalBody}>Confirm that this person has now left the site.</Text>
            <View style={s.modalBtns}>
              <TouchableOpacity onPress={() => setSignOutTarget(null)} style={s.modalCancelBtn}>
                <Text style={s.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSignOutVisitor} disabled={signingOutVisitor} style={s.signOutConfirmBtn}>
                {signingOutVisitor ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.modalConfirmTxt}>Sign out</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2b4594',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 12, color: '#6b7280' },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  actionCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  actionSub: { fontSize: 13, color: '#6b7280', marginTop: 4, lineHeight: 19 },
  actionButtons: { flexDirection: 'row', gap: 10, marginTop: 14 },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2b4594',
    borderRadius: 12,
    paddingVertical: 12,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  secondaryBtnText: { color: '#2b4594', fontWeight: '700', fontSize: 15 },
  sitePickerWrap: { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 10, backgroundColor: '#fff', zIndex: 10 },
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
    top: 56,
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
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2b4594' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  tabTextActive: { color: '#2b4594', fontWeight: '700' },
  tabBadge: { backgroundColor: '#ef4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
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
  visitSub: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  visitNote: { fontSize: 12, color: '#2b4594', marginTop: 3 },
  signOutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  signOutChipTxt: { fontSize: 12, fontWeight: '600', color: '#ef4444' },
  arriveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2b4594',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: 84,
    justifyContent: 'center',
  },
  arriveBtnTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  emptyText: { color: '#9ca3af', fontSize: 14, textAlign: 'center' },
  addPreregBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2b4594',
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 16,
  },
  addPreregTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  modalBody: { fontSize: 14, color: '#6b7280', lineHeight: 21, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  notesInput: { minHeight: 82, textAlignVertical: 'top' },
  groupPicker: { marginBottom: 12, maxHeight: 42 },
  groupChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  groupChipActive: { backgroundColor: '#2b4594', borderColor: '#2b4594' },
  groupChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  groupChipTextActive: { color: '#fff' },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 14 },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  modalCancelTxt: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  modalConfirmBtn: {
    backgroundColor: '#2b4594',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 96,
    alignItems: 'center',
  },
  signOutConfirmBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 96,
    alignItems: 'center',
  },
  modalConfirmTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

export default SecurityGuardScreen;
