import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Plus, Calendar, ChevronDown } from 'lucide-react-native';
import api from '../services/api';

const DAYS = ['Mo','Tu','We','Th','Fr','Sa','Su'];

const getWeekDays = (pivot) => {
  const d = new Date(pivot);
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => { const dd = new Date(mon); dd.setDate(mon.getDate() + i); return dd; });
};

const isoDate = (d) => d.toISOString().split('T')[0];
const fmtMonthYear = (d) => d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
const fmtTime = (t) => { if (!t) return '—'; if (t.includes(':')) return t.slice(0,5); try { return new Date(t).toTimeString().slice(0,5); } catch { return t; } };

const fmtHours = (h) => {
  if (!h && h !== 0) return null;
  const hrs = Math.floor(h); const mins = Math.round((h - hrs) * 60);
  if (hrs === 0 && mins === 0) return '0m';
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

const CalendarScreen = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [week, setWeek]                 = useState(getWeekDays(new Date()));
  const [dayData, setDayData]           = useState({});
  const [weekSummary, setWeekSummary]   = useState({ worked: 0, total: 40 });
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const today = new Date();

  const memberName = user?.name || user?.firstName || '';

  const loadData = useCallback(async () => {
    try {
      const mon = week[0];
      const sun = week[6];
      const params = { date_from: isoDate(mon), date_to: isoDate(sun) };
      if (memberName) params.search = memberName;
      const res = await api.get(`/attendance/timesheets`, { params });
      const rows = res.data?.rows || [];

      const map = {};
      let weekWorked = 0;

      rows.forEach(row => {
        Object.entries(row.days || {}).forEach(([date, entry]) => {
          if (!map[date]) map[date] = { entries: [], totalHours: 0, firstIn: null, lastOut: null, siteName: 'Site' };
          map[date].entries.push({ signIn: entry.sign_in, signOut: entry.sign_out, hours: entry.hours || 0, name: row.name });
          map[date].totalHours += entry.hours || 0;
          weekWorked += entry.hours || 0;
          if (!map[date].firstIn || entry.sign_in < map[date].firstIn) map[date].firstIn = entry.sign_in;
          if (!map[date].lastOut || (entry.sign_out && entry.sign_out > map[date].lastOut)) map[date].lastOut = entry.sign_out;
        });
      });

      setDayData(map);
      setWeekSummary({ worked: weekWorked, total: 40 });
    } catch (err) {
      console.log('Calendar load error:', err.message);
    } finally { setLoading(false); setRefreshing(false); }
  }, [week]);

  useEffect(() => { loadData(); }, [loadData]);

  const changeWeek = (dir) => {
    const pivot = new Date(week[0]);
    pivot.setDate(pivot.getDate() + dir * 7);
    setWeek(getWeekDays(pivot));
    setSelectedDate(pivot);
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  // Feed: group dates by week/day sections
  const feedDates = week.filter(d => d <= today);

  const groupByWeek = (dates) => {
    const groups = {};
    dates.forEach(d => {
      const mon = getWeekDays(d)[0];
      const key = isoDate(mon);
      if (!groups[key]) groups[key] = { label: getWeekLabel(mon), dates: [] };
      groups[key].dates.push(d);
    });
    return Object.values(groups);
  };

  const getWeekLabel = (mon) => {
    const thisMon = getWeekDays(today)[0];
    if (isoDate(mon) === isoDate(thisMon)) return 'This week';
    return mon.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const groups = groupByWeek(feedDates);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.logo}>
          <View style={[s.dot, { backgroundColor: '#2b4594', marginRight: -10, zIndex: 1 }]} />
          <View style={[s.dot, { backgroundColor: '#2b4594', opacity: 0.85 }]} />
        </View>
        <TouchableOpacity style={s.plusBtn}><Plus size={22} color="#1e293b" /></TouchableOpacity>
      </View>

      {/* Month + calendar icon */}
      <View style={s.monthRow}>
        <TouchableOpacity style={s.monthPicker}>
          <Text style={s.monthText}>{fmtMonthYear(selectedDate)}</Text>
          <ChevronDown size={18} color="#6b7280" />
        </TouchableOpacity>
        <TouchableOpacity style={s.calBtn}><Calendar size={22} color="#1e293b" /></TouchableOpacity>
      </View>

      {/* Week strip */}
      <View style={s.weekStrip}>
        {week.map((d, i) => {
          const sel = isoDate(d) === isoDate(selectedDate);
          const tod = isoDate(d) === isoDate(today);
          const hasDot = !!dayData[isoDate(d)];
          return (
            <TouchableOpacity key={i} onPress={() => setSelectedDate(d)} style={[s.dayBtn, sel && s.dayBtnSel]}>
              <Text style={[s.dayLabel, sel && s.dayLabelSel]}>{DAYS[i]}</Text>
              <Text style={[s.dayNum, sel && s.dayNumSel]}>{d.getDate()}</Text>
              {hasDot && <View style={[s.actDot, sel && s.actDotSel]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={s.centered}><ActivityIndicator color="#2b4594" size="large" /></View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2b4594" />}
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
        >
          {groups.map((group, gi) => {
            // Week summary
            const weekWorked = group.dates.reduce((acc, d) => acc + (dayData[isoDate(d)]?.totalHours || 0), 0);

            return (
              <View key={gi}>
                <Text style={s.weekLabel}>{group.label}</Text>

                {/* Worked / Total time summary cards for "This week" */}
                {gi === groups.length - 1 && weekWorked > 0 && (
                  <View style={s.summaryRow}>
                    <View style={[s.summaryCard, { borderColor: '#2b4594' }]}>
                      <Text style={s.summaryTop}>Worked</Text>
                      <Text style={s.summaryVal}>{fmtHours(weekWorked)}</Text>
                    </View>
                    <View style={[s.summaryCard, { borderColor: '#2b4594' }]}>
                      <Text style={s.summaryTop}>Total time</Text>
                      <Text style={s.summaryVal}>{fmtHours(weekSummary.total)}</Text>
                    </View>
                  </View>
                )}

                {group.dates.map((d, di) => {
                  const dateStr  = isoDate(d);
                  const data     = dayData[dateStr];
                  const isToday  = isoDate(d) === isoDate(today);
                  const dayLabel = isToday ? null : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

                  if (!data) return null;

                  return (
                    <View key={di}>
                      {dayLabel && <Text style={s.daySection}>{dayLabel}</Text>}

                      <View style={s.entryCard}>
                        <Text style={s.siteName}>{data.siteName || selectedDate?.name || 'Site'}</Text>
                        {data.entries.map((e, ei) => (
                          <View key={ei}>
                            {/* Sign in row */}
                            <View style={s.timelineRow}>
                              <View style={s.timelineLine}>
                                <View style={s.greenDot} />
                                <View style={s.vertLine} />
                                <View style={s.greenDot} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <View style={s.timeRow}>
                                  <Text style={s.timeText}>{fmtTime(e.signIn)}</Text>
                                  <Text style={s.eventLabel}>Signed in</Text>
                                </View>
                                <View style={[s.timeRow, { marginTop: 12 }]}>
                                  <Text style={s.timeText}>{fmtTime(e.signOut)}</Text>
                                  <Text style={s.eventLabel}>Signed out</Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        ))}
                        <View style={s.totalRow}>
                          <Text style={s.totalLabel}>Total</Text>
                          <Text style={s.totalVal}>{fmtHours(data.totalHours) || '0m'}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })}

          {groups.every(g => g.dates.every(d => !dayData[isoDate(d)])) && (
            <View style={s.emptyWrap}>
              <Text style={s.empty}>No activity this week</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f3f4f6' },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  logo:        { flexDirection: 'row', alignItems: 'center' },
  dot:         { width: 36, height: 36, borderRadius: 18 },
  plusBtn:     { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  monthRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4, gap: 8 },
  monthPicker: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff' },
  monthText:   { fontSize: 16, fontWeight: '500', color: '#1f2937' },
  calBtn:      { width: 48, height: 48, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  weekStrip:   { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  dayBtn:      { alignItems: 'center', justifyContent: 'center', width: 44, paddingVertical: 8, borderRadius: 22 },
  dayBtnSel:   { backgroundColor: '#2b4594' },
  dayLabel:    { fontSize: 11, fontWeight: '500', marginBottom: 4, color: '#6b7280' },
  dayLabelSel: { color: '#ffffff' },
  dayNum:      { fontSize: 16, fontWeight: '700', color: '#111827' },
  dayNumSel:   { color: '#ffffff' },
  actDot:      { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#111827', marginTop: 3 },
  actDotSel:   { backgroundColor: '#ffffff' },
  weekLabel:   { fontSize: 18, fontWeight: '700', color: '#111827', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  summaryRow:  { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  summaryCard: { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 14, backgroundColor: '#fff' },
  summaryTop:  { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  summaryVal:  { fontSize: 20, fontWeight: '700', color: '#111827' },
  daySection:  { fontSize: 16, fontWeight: '700', color: '#111827', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  entryCard:   { backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6' },
  siteName:    { fontSize: 14, color: '#9ca3af', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  timelineRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12 },
  timelineLine:{ width: 20, alignItems: 'center', marginRight: 14 },
  greenDot:    { width: 14, height: 14, borderRadius: 7, backgroundColor: '#2b4594' },
  vertLine:    { flex: 1, width: 2, backgroundColor: '#2b4594', minHeight: 24 },
  timeRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeText:    { fontSize: 17, fontWeight: '700', color: '#111827', width: 50 },
  eventLabel:  { fontSize: 14, color: '#6b7280' },
  totalRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  totalLabel:  { fontSize: 14, fontWeight: '700', color: '#111827' },
  totalVal:    { fontSize: 14, color: '#6b7280' },
  emptyWrap:   { alignItems: 'center', paddingTop: 60 },
  empty:       { fontSize: 15, color: '#9ca3af' },
});

export default CalendarScreen;
