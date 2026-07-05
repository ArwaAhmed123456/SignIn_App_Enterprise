import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  SafeAreaView, StyleSheet, ActivityIndicator, Switch, Alert,
} from 'react-native';
import { ArrowLeft, Search, ChevronDown, Plus, Check } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const fmtDate = (d) => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtTime = (d) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

// ─── Step 1: Select group ─────────────────────────────────────────────────────
const SelectGroupStep = ({ onSelect }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/visitor-groups').then(r => setGroups(r.data || [])).catch(() => setGroups([
      { id: 'v', name: 'Visitors' }, { id: 'e', name: 'Employees' },
    ])).finally(() => setLoading(false));
  }, []);

  const COLORS = ['#4ade80','#2b4594','#f59e0b','#8b5cf6','#ef4444','#06b6d4'];

  if (loading) return <View style={s.centered}><ActivityIndicator color="#4ade80" /></View>;

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={s.stepTitle}>Select a group</Text>
      {groups.map((g, i) => (
        <TouchableOpacity key={g.id} onPress={() => onSelect(g)} style={s.listItem} activeOpacity={0.75}>
          <View style={[s.groupDot, { backgroundColor: COLORS[i % COLORS.length] }]}>
            <Text style={s.groupDotText}>{(g.name||'G')[0].toUpperCase()}</Text>
          </View>
          <Text style={s.listItemText}>{g.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ─── Step 2: Enter details ────────────────────────────────────────────────────
const EnterDetailsStep = ({ group, onSubmit, onBack }) => {
  const [isExisting, setIsExisting]     = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [fullName, setFullName]         = useState('');
  const [email, setEmail]               = useState('');
  const [phone, setPhone]               = useState('');
  const [role, setRole]                 = useState('Visitor');
  const [multiDay, setMultiDay]         = useState(false);
  const [startDate]                     = useState(new Date());
  const [arrivalTime]                   = useState(fmtTime(new Date()));
  const [notes, setNotes]               = useState('');
  const [sendInvite, setSendInvite]     = useState(true);
  const [extraComments, setExtraComments] = useState('');
  const [saving, setSaving]             = useState(false);
  const [nameError, setNameError]       = useState('');

  const handleSubmit = async () => {
    const name = isExisting ? memberSearch.trim() : fullName.trim();
    if (!name) { setNameError('Full name is required'); return; }
    setNameError('');
    setSaving(true);
    try {
      const res = await api.post('/pre-registrations', {
        name, email: email || undefined, phone: phone || undefined,
        notes, expected_date: `${startDate.toISOString().split('T')[0]}T${arrivalTime}`,
        visitor_group_id: group.id, send_invitation: sendInvite && !!email,
      });
      onSubmit({ name, date: startDate, time: arrivalTime, id: res.data?.pre_registration?.id });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to pre-register. Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={s.radioRow}>
        {[['Existing group member', true], ['New visitor', false]].map(([label, val]) => (
          <TouchableOpacity key={label} onPress={() => setIsExisting(val)} style={s.radioItem}>
            <View style={[s.radioCircle, isExisting === val && s.radioCircleActive]}>
              {isExisting === val && <Check size={14} color="#ffffff" />}
            </View>
            <Text style={s.radioLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isExisting ? (
        <View style={s.inputWrap}>
          <View style={s.searchRow}>
            <Search size={16} color="#9ca3af" />
            <TextInput value={memberSearch} onChangeText={setMemberSearch} placeholder="Enter name..." style={s.searchInput} />
          </View>
        </View>
      ) : (
        <>
          <View style={s.inputGroup}>
            <Text style={s.label}>Full name <Text style={{ color: '#ef4444' }}>*</Text></Text>
            <TextInput value={fullName} onChangeText={t => { setFullName(t); setNameError(''); }} style={[s.input, nameError && { borderColor: '#ef4444' }]} />
            {nameError ? <Text style={s.errorText}>{nameError}</Text> : null}
          </View>
          <View style={s.inputGroup}>
            <Text style={s.label}>Email</Text>
            <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={s.input} />
          </View>
          <View style={s.inputGroup}>
            <Text style={s.label}>Phone number</Text>
            <View style={s.phoneRow}>
              <View style={s.flagBox}><Text>🇬🇧 +44</Text><ChevronDown size={14} color="#6b7280" /></View>
              <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={[s.input, { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]} />
            </View>
          </View>
          <View style={s.inputGroup}>
            <Text style={s.label}>Role</Text>
            <TextInput value={role} onChangeText={setRole} style={s.input} />
          </View>
        </>
      )}

      {/* Date/time section */}
      <View style={[s.dateSection, { marginTop: 16 }]}>
        <View style={s.switchRow}>
          <Text style={s.label}>Multi-day visit</Text>
          <Switch value={multiDay} onValueChange={setMultiDay} trackColor={{ true: '#4ade80', false: '#e5e7eb' }} thumbColor="#fff" />
        </View>
        <View style={s.inputGroup}>
          <Text style={s.label}>Start date</Text>
          <View style={s.dateRow}><Text style={s.calIcon}>📅</Text><Text style={s.dateText}>{fmtDate(startDate)}</Text></View>
        </View>
        <View style={s.inputGroup}>
          <Text style={s.label}>Arrival time</Text>
          <View style={s.dateRow}><Text style={s.calIcon}>🕐</Text><Text style={s.dateText}>{arrivalTime}</Text></View>
        </View>
        <TouchableOpacity style={s.addVisitBtn}><Plus size={18} color="#4ade80" /><Text style={s.addVisitText}>Add another visit</Text></TouchableOpacity>
      </View>

      {/* Notes */}
      <View style={s.inputGroup}>
        <Text style={s.label}>Notes (for internal use only)</Text>
        <TextInput value={notes} onChangeText={setNotes} multiline numberOfLines={4} placeholder="Add a note..." style={[s.input, { height: 100, textAlignVertical: 'top' }]} />
      </View>

      {/* Send invite */}
      <View style={s.switchRow}>
        <Text style={[s.label, { marginBottom: 0, flex: 1 }]}>Send email invite</Text>
        <Switch value={sendInvite} onValueChange={setSendInvite} trackColor={{ true: '#4ade80', false: '#e5e7eb' }} thumbColor="#fff" disabled={!email} />
      </View>
      {!email && !isExisting && <Text style={s.helperText}>This member doesn't have an email.</Text>}

      {/* Additional comments */}
      <View style={s.inputGroup}>
        <Text style={s.label}>Additional comments for the visitor</Text>
        <TextInput value={extraComments} onChangeText={setExtraComments} multiline numberOfLines={3} style={[s.input, { height: 80, textAlignVertical: 'top' }]} />
      </View>

      {/* Submit */}
      <TouchableOpacity onPress={handleSubmit} disabled={saving} style={[s.submitBtn, saving && { opacity: 0.6 }]} activeOpacity={0.85}>
        {saving ? <ActivityIndicator color="#111827" /> : <Text style={s.submitText}>Pre-register</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

// ─── Step 3: Success ──────────────────────────────────────────────────────────
const SuccessStep = ({ result, onDone }) => {
  const initials = (result.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const month = result.date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
  const day   = result.date.getDate();
  return (
    <View style={s.successWrap}>
      <View style={s.avatarBig}><Text style={s.avatarText}>{initials}</Text></View>
      <Text style={s.successName}>{result.name}</Text>
      <Text style={s.successSub}>Successfully pre-registered for the following dates...</Text>
      <View style={s.divider} />
      <View style={s.dateCard}>
        <View style={s.monthBadge}><Text style={s.monthText}>{month}</Text><Text style={s.dayText}>{day}</Text></View>
        <View style={{ marginLeft: 16 }}>
          <Text style={s.dateCardDate}>{result.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
          <Text style={s.dateCardTime}>{result.time}</Text>
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <TouchableOpacity onPress={onDone} style={s.doneBtn} activeOpacity={0.85}><Text style={s.doneText}>Done</Text></TouchableOpacity>
    </View>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const PreregisterScreen = ({ navigation }) => {
  const [step, setStep]     = useState('group');
  const [group, setGroup]   = useState(null);
  const [result, setResult] = useState(null);

  const handleBack = () => {
    if (step === 'details') { setStep('group'); return; }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn}><ArrowLeft size={22} color="#111827" /></TouchableOpacity>
        <Text style={s.headerTitle}>
          {step === 'group' ? 'Select a group' : step === 'details' ? 'Enter details' : ''}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {step === 'group'   && <SelectGroupStep  onSelect={g => { setGroup(g); setStep('details'); }} />}
      {step === 'details' && <EnterDetailsStep group={group} onBack={handleBack} onSubmit={r => { setResult(r); setStep('success'); }} />}
      {step === 'success' && <SuccessStep result={result} onDone={() => navigation.goBack()} />}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f9fafb' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', backgroundColor: '#fff' },
  backBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { fontSize: 18, fontWeight: '700', color: '#111827' },
  centered:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stepTitle:     { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 16 },
  listItem:      { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 10 },
  groupDot:      { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  groupDotText:  { color: '#fff', fontSize: 18, fontWeight: '700' },
  listItemText:  { fontSize: 17, fontWeight: '600', color: '#111827' },
  radioRow:      { marginBottom: 20, gap: 12 },
  radioItem:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  radioCircle:   { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  radioCircleActive: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  radioLabel:    { fontSize: 15, color: '#111827' },
  inputGroup:    { marginBottom: 16 },
  label:         { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input:         { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, backgroundColor: '#fff', color: '#111827' },
  errorText:     { color: '#ef4444', fontSize: 12, marginTop: 4 },
  phoneRow:      { flexDirection: 'row' },
  flagBox:       { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#e5e7eb', borderTopLeftRadius: 10, borderBottomLeftRadius: 10, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#f9fafb' },
  searchRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#4ade80', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff' },
  searchInput:   { flex: 1, fontSize: 15, color: '#111827' },
  dateSection:   { backgroundColor: '#f3f4f6', borderRadius: 14, padding: 16, marginBottom: 16 },
  switchRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  dateRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff' },
  calIcon:       { fontSize: 16 },
  dateText:      { fontSize: 15, color: '#111827' },
  addVisitBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  addVisitText:  { fontSize: 15, color: '#4ade80', fontWeight: '600' },
  helperText:    { fontSize: 13, color: '#9ca3af', marginTop: 4, marginBottom: 12 },
  submitBtn:     { backgroundColor: '#4ade80', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitText:    { fontSize: 17, fontWeight: '700', color: '#111827' },
  successWrap:   { flex: 1, alignItems: 'center', padding: 24 },
  avatarBig:     { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center', marginTop: 32, marginBottom: 12 },
  avatarText:    { fontSize: 28, fontWeight: '700', color: '#fff' },
  successName:   { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  successSub:    { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
  divider:       { width: '100%', height: 1, backgroundColor: '#f3f4f6', marginBottom: 16 },
  dateCard:      { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 12 },
  monthBadge:    { width: 52, height: 52, borderRadius: 26, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  monthText:     { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  dayText:       { fontSize: 20, fontWeight: '700', color: '#fff' },
  dateCardDate:  { fontSize: 16, fontWeight: '700', color: '#111827' },
  dateCardTime:  { fontSize: 14, color: '#6b7280', marginTop: 2 },
  doneBtn:       { width: '100%', backgroundColor: '#4ade80', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  doneText:      { fontSize: 17, fontWeight: '700', color: '#111827' },
  inputWrap:     { marginBottom: 16 },
});

export default PreregisterScreen;
