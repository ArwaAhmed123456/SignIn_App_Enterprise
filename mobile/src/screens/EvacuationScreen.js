import React, { useState, useCallback } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { AlertTriangle, CheckCircle, RefreshCw, Users } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const EvacuationScreen = () => {
  const { user } = useAuth();
  const [onSite, setOnSite]         = useState([]);
  const [accounted, setAccounted]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [active, setActive]         = useState(false);
  const [siteName, setSiteName]     = useState('');

  const siteId = user?.project_id;

  const loadEvacuation = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    try {
      const res = await api.get('/visits', {
        params: { site_id: siteId, status: 'In' },
      });
      const visits = res.data || [];
      setOnSite(visits);
      setAccounted([]);

      const siteRes = await api.get('/projects').catch(() => ({ data: [] }));
      const site = (siteRes.data || []).find(s => s.id === siteId);
      setSiteName(site?.name || 'Site');
    } catch (err) {
      console.log('Evacuation load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [siteId]);

  const startEvacuation = () => {
    Alert.alert(
      'Start Evacuation',
      'This will begin an evacuation roll call. All people currently signed in will need to be accounted for.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start', style: 'destructive',
          onPress: () => { setActive(true); loadEvacuation(); },
        },
      ]
    );
  };

  const markSafe = (visit) => {
    setAccounted(prev => [...prev, visit.id]);
  };

  const endEvacuation = () => {
    Alert.alert(
      'End Evacuation',
      'Mark this evacuation as complete?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End', onPress: () => {
            setActive(false);
            setOnSite([]);
            setAccounted([]);
          },
        },
      ]
    );
  };

  const missing   = onSite.filter(v => !accounted.includes(v.id));
  const safe      = onSite.filter(v =>  accounted.includes(v.id));
  const total     = onSite.length;
  const safeCount = safe.length;

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <AlertTriangle size={22} color={active ? '#ef4444' : '#2b4594'} />
          <Text style={s.headerTitle}>Evacuation</Text>
        </View>
        {active && (
          <TouchableOpacity onPress={() => { setRefreshing(true); loadEvacuation(); }} style={s.refreshBtn}>
            <RefreshCw size={18} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {!active ? (
        /* ── Not started ── */
        <View style={s.startWrap}>
          <View style={s.iconCircle}>
            <AlertTriangle size={40} color="#ef4444" />
          </View>
          <Text style={s.startTitle}>Emergency Evacuation</Text>
          <Text style={s.startDesc}>
            In an emergency, tap the button below to start a roll call of everyone currently on site.
          </Text>

          {!siteId ? (
            <View style={s.warnCard}>
              <Text style={s.warnText}>No site linked to your account. Contact your administrator.</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={startEvacuation} style={s.startBtn} activeOpacity={0.85}>
              <AlertTriangle size={20} color="#fff" />
              <Text style={s.startBtnText}>Start Evacuation</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* ── Active evacuation ── */
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadEvacuation(); }} tintColor="#ef4444" />}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Progress banner */}
          <View style={[s.banner, safeCount === total && total > 0 ? s.bannerGreen : s.bannerRed]}>
            <Text style={s.bannerTitle}>
              {safeCount === total && total > 0
                ? '✅ All accounted for'
                : `${safeCount} / ${total} accounted for`}
            </Text>
            <Text style={s.bannerSub}>{siteName}</Text>
          </View>

          {/* Summary pills */}
          <View style={s.pillRow}>
            <View style={[s.pill, { borderColor: '#16a34a' }]}>
              <Text style={[s.pillNum, { color: '#16a34a' }]}>{safeCount}</Text>
              <Text style={s.pillLabel}>Safe</Text>
            </View>
            <View style={[s.pill, { borderColor: '#ef4444' }]}>
              <Text style={[s.pillNum, { color: '#ef4444' }]}>{missing.length}</Text>
              <Text style={s.pillLabel}>Missing</Text>
            </View>
            <View style={[s.pill, { borderColor: '#2b4594' }]}>
              <Text style={[s.pillNum, { color: '#2b4594' }]}>{total}</Text>
              <Text style={s.pillLabel}>Total</Text>
            </View>
          </View>

          {loading ? (
            <View style={s.centered}><ActivityIndicator color="#ef4444" size="large" /></View>
          ) : (
            <>
              {/* Missing */}
              {missing.length > 0 && (
                <>
                  <Text style={s.sectionTitle}>Not yet accounted for</Text>
                  {missing.map(visit => (
                    <View key={visit.id} style={s.visitCard}>
                      <View style={[s.avatar, { backgroundColor: '#fef2f2' }]}>
                        <Text style={[s.avatarTxt, { color: '#ef4444' }]}>{(visit.name||'?')[0].toUpperCase()}</Text>
                      </View>
                      <View style={s.visitMeta}>
                        <Text style={s.visitName}>{visit.name}</Text>
                        <Text style={s.visitSub}>{visit.group}</Text>
                      </View>
                      <TouchableOpacity onPress={() => markSafe(visit)} style={s.safeBtn}>
                        <CheckCircle size={16} color="#fff" />
                        <Text style={s.safeBtnTxt}>Safe</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}

              {/* Accounted */}
              {safe.length > 0 && (
                <>
                  <Text style={[s.sectionTitle, { color: '#16a34a' }]}>Accounted for ✓</Text>
                  {safe.map(visit => (
                    <View key={visit.id} style={[s.visitCard, { opacity: 0.6 }]}>
                      <View style={[s.avatar, { backgroundColor: '#f0fdf4' }]}>
                        <Text style={[s.avatarTxt, { color: '#16a34a' }]}>{(visit.name||'?')[0].toUpperCase()}</Text>
                      </View>
                      <View style={s.visitMeta}>
                        <Text style={s.visitName}>{visit.name}</Text>
                        <Text style={s.visitSub}>{visit.group}</Text>
                      </View>
                      <CheckCircle size={22} color="#16a34a" />
                    </View>
                  ))}
                </>
              )}

              {total === 0 && (
                <View style={s.emptyCard}>
                  <Users size={32} color="#9ca3af" />
                  <Text style={s.emptyText}>No one is currently signed in.</Text>
                </View>
              )}
            </>
          )}

          {/* End evacuation */}
          <TouchableOpacity onPress={endEvacuation} style={s.endBtn}>
            <Text style={s.endBtnTxt}>End Evacuation</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f3f4f6' },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle:  { fontSize: 18, fontWeight: '700', color: '#111827' },
  refreshBtn:   { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  startWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconCircle:   { width: 90, height: 90, borderRadius: 45, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  startTitle:   { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 12, textAlign: 'center' },
  startDesc:    { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  warnCard:     { backgroundColor: '#fef3c7', borderRadius: 12, padding: 16 },
  warnText:     { fontSize: 14, color: '#92400e', textAlign: 'center' },
  startBtn:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ef4444', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 36, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  startBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  banner:       { padding: 20, alignItems: 'center' },
  bannerRed:    { backgroundColor: '#ef4444' },
  bannerGreen:  { backgroundColor: '#16a34a' },
  bannerTitle:  { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bannerSub:    { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  pillRow:      { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  pill:         { flex: 1, borderWidth: 2, borderRadius: 12, padding: 12, alignItems: 'center', backgroundColor: '#fff' },
  pillNum:      { fontSize: 26, fontWeight: '800' },
  pillLabel:    { fontSize: 12, color: '#6b7280', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', paddingHorizontal: 16, marginTop: 8, marginBottom: 8 },
  visitCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderColor: '#f3f4f6' },
  avatar:       { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:    { fontSize: 18, fontWeight: '700' },
  visitMeta:    { flex: 1 },
  visitName:    { fontSize: 15, fontWeight: '600', color: '#111827' },
  visitSub:     { fontSize: 13, color: '#9ca3af', marginTop: 1 },
  safeBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#16a34a', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  safeBtnTxt:   { fontSize: 13, fontWeight: '700', color: '#fff' },
  emptyCard:    { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText:    { fontSize: 15, color: '#9ca3af' },
  endBtn:       { margin: 16, marginTop: 24, backgroundColor: '#1f2937', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  endBtnTxt:    { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default EvacuationScreen;
