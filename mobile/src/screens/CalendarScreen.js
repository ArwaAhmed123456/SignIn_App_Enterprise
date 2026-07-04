import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Plus, Calendar, ChevronDown } from 'lucide-react-native';

const DAYS_OF_WEEK = ['Mo','Tu','We','Th','Fr','Sa','Su'];

const getWeekDays = (pivotDate) => {
  const d    = new Date(pivotDate);
  const day  = d.getDay();
  const mon  = new Date(d);
  mon.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(mon);
    dd.setDate(mon.getDate() + i);
    return dd;
  });
};

const fmtMonthYear = (d) =>
  d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

const fmtDayLabel = (d) =>
  d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase().slice(0, 3);

// Build a list of past 30 + next 7 days for the scroll feed
const buildFeed = (selectedDate) => {
  const days = [];
  const start = new Date(selectedDate);
  start.setDate(selectedDate.getDate() - 4);
  for (let i = 0; i < 12; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
};

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const today = new Date();
  const week  = getWeekDays(selectedDate);
  const feed  = buildFeed(selectedDate);

  const isToday = (d) => d.toDateString() === today.toDateString();
  const isSel   = (d) => d.toDateString() === selectedDate.toDateString();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#4ade80', marginRight: -10, zIndex: 1 }} />
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#2b4594', opacity: 0.85 }} />
        </View>
        <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
          <Plus size={22} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {/* Month Selector */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4, gap: 8 }}>
        <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#ffffff' }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#1f2937' }}>{fmtMonthYear(selectedDate)}</Text>
          <ChevronDown size={20} color="#6b7280" />
        </TouchableOpacity>
        <TouchableOpacity style={{ width: 48, height: 48, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
          <Calendar size={22} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {/* Week Strip */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        {week.map((d, i) => {
          const sel = isSel(d);
          return (
            <TouchableOpacity key={i} onPress={() => setSelectedDate(d)}
              style={{ alignItems: 'center', justifyContent: 'center', width: 44, paddingVertical: 8, borderRadius: 22,
                backgroundColor: sel ? '#4ade80' : 'transparent' }}>
              <Text style={{ fontSize: 11, fontWeight: '500', marginBottom: 4,
                color: sel ? '#ffffff' : '#6b7280' }}>
                {DAYS_OF_WEEK[i]}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '700',
                color: sel ? '#ffffff' : '#111827' }}>
                {d.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day Feed */}
      <ScrollView style={{ flex: 1, backgroundColor: '#f3f4f6' }} contentContainerStyle={{ paddingBottom: 24 }}>
        {feed.map((d, i) => (
          <View key={i} style={{ alignItems: 'center', paddingVertical: 12 }}>
            {/* Black pill badge */}
            <View style={{ backgroundColor: '#111827', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 8 }}>
              <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
                {fmtDayLabel(d)} {d.getDate()}
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: '#9ca3af' }}>No activity today</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CalendarScreen;
