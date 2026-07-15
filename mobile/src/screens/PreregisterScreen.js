import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, ChevronDown, Clock } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  createPreRegistration,
  getAccessibleSites,
  getVisitorGroups,
} from '../services/enterprisePortal';

const getDefaultDate = () => {
  const now = new Date();
  return now.toISOString().slice(0, 10);
};

const getDefaultTime = () => {
  const now = new Date();
  const later = new Date(now.getTime() + 60 * 60 * 1000);
  return `${String(later.getHours()).padStart(2, '0')}:${String(later.getMinutes()).padStart(2, '0')}`;
};

const formatSummaryDate = (dateString, timeString) => {
  try {
    return new Date(`${dateString}T${timeString}`).toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return `${dateString} ${timeString}`;
  }
};

const SuccessStep = ({ result, onDone }) => {
  const initials = (result?.name || '?')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={s.successWrap}>
      <View style={s.avatarBig}>
        <Text style={s.avatarText}>{initials}</Text>
      </View>
      <Text style={s.successName}>{result?.name}</Text>
      <Text style={s.successSub}>The visitor has been pre-registered successfully.</Text>
      <View style={s.summaryCard}>
        <Text style={s.summaryTitle}>Arrival</Text>
        <Text style={s.summaryValue}>{result?.arrivalLabel}</Text>
        <Text style={s.summaryTitle}>Site</Text>
        <Text style={s.summaryValue}>{result?.siteName}</Text>
        <Text style={s.summaryTitle}>Group</Text>
        <Text style={s.summaryValue}>{result?.groupName}</Text>
      </View>
      <TouchableOpacity onPress={onDone} style={s.doneBtn}>
        <Text style={s.doneText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

const PreregisterScreen = ({ navigation, route }) => {
  const initialSiteId = route?.params?.siteId || null;
  const initialSiteName = route?.params?.siteName || '';
  const { user } = useAuth();

  const [sites, setSites] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(initialSiteId);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [siteOpen, setSiteOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  // Date/time stored as JS Date objects for the picker
  const [arrivalDateObj, setArrivalDateObj] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate()); // today
    return d;
  });
  const [arrivalTimeObj, setArrivalTimeObj] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0); // 1 hour from now
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [sendInvite, setSendInvite] = useState(true);

  // Formatted strings for display and API
  const arrivalDateDisplay = arrivalDateObj.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const arrivalTimeDisplay = arrivalTimeObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
  const arrivalDate = arrivalDateObj.toISOString().slice(0, 10);
  const arrivalTime = `${String(arrivalTimeObj.getHours()).padStart(2, '0')}:${String(arrivalTimeObj.getMinutes()).padStart(2, '0')}`;

  useEffect(() => {
    const load = async () => {
      try {
        const siteList = await getAccessibleSites(initialSiteId);
        setSites(siteList);

        const siteId = initialSiteId || siteList?.[0]?.id || null;
        setSelectedSiteId(siteId);

        if (siteId) {
          const groupList = await getVisitorGroups(siteId);
          setGroups(groupList);
          setSelectedGroupId(groupList?.[0]?.id || null);
        }
      } catch (error) {
        console.log('PreregisterScreen load error:', error?.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [initialSiteId]);

  useEffect(() => {
    const loadGroups = async () => {
      if (!selectedSiteId) return;
      const groupList = await getVisitorGroups(selectedSiteId);
      setGroups(groupList);
      if (!groupList.find((item) => item.id === selectedGroupId)) {
        setSelectedGroupId(groupList?.[0]?.id || null);
      }
    };

    loadGroups();
  }, [selectedSiteId]);

  const selectedSite = useMemo(
    () => sites.find((site) => site.id === selectedSiteId) || { id: selectedSiteId, name: initialSiteName || 'Selected site' },
    [initialSiteName, selectedSiteId, sites],
  );

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) || null,
    [groups, selectedGroupId],
  );

  const handleSubmit = async () => {
    const role = String(user?.mobileRole || user?.role || '').toLowerCase();
    if (role.includes('guard') || role.includes('security')) {
      Alert.alert('Manager access required', 'Only managers can create pre-registrations.');
      navigation.goBack();
      return;
    }
    if (!selectedSiteId) {
      Alert.alert('Site required', 'Please select a site.');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter the visitor name.');
      return;
    }

    if (!arrivalDate || !arrivalTime) {
      Alert.alert('Arrival required', 'Please select an arrival date and time.');
      return;
    }

    setSaving(true);
    try {
      await createPreRegistration({
        siteId: selectedSiteId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        companyName: companyName.trim(),
        expectedDate: `${arrivalDate}T${arrivalTime}`,
        visitorGroupId: selectedGroupId,
        visitorGroupName: selectedGroup?.name || undefined,
        sendInvitation: sendInvite,
      });

      // Post a team chat notification
      try {
        const siteId = selectedSiteId || user?.project_id || user?.site_id;
        if (siteId) {
          await api.post('/messages', {
            // IMPORTANT: pre-registration ≠ arrival. Keep wording explicit so managers
            // don't interpret this as "visitor is at the door".
            text: `📝 Pre-registered (not arrived yet): ${name.trim()}`,
            site_id: siteId,
            type: 'notification',
          });
        }
      } catch (msgErr) {
        console.log('Pre-registration chat message failed:', msgErr.message);
      }

      setSuccess({
        name: name.trim(),
        siteName: selectedSite?.name || 'Selected site',
        groupName: selectedGroup?.name || 'Visitor',
        arrivalLabel: formatSummaryDate(arrivalDate, arrivalTime),
      });
    } catch (error) {
      Alert.alert('Pre-registration failed', error?.response?.data?.error || 'Could not save this pre-registration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#2b4594" />
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <SuccessStep result={success} onDone={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Pre-register person</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView contentContainerStyle={s.formWrap}>
        <Text style={s.sectionTitle}>Visit details</Text>

        <View style={s.inputGroup}>
          <Text style={s.label}>Site</Text>
          <TouchableOpacity onPress={() => setSiteOpen((value) => !value)} style={s.selector}>
            <Text style={s.selectorText}>{selectedSite?.name || 'Select site'}</Text>
            <ChevronDown size={16} color="#6b7280" />
          </TouchableOpacity>
          {siteOpen ? (
            <View style={s.dropdown}>
              {sites.map((site) => (
                <TouchableOpacity
                  key={site.id}
                  onPress={() => {
                    setSelectedSiteId(site.id);
                    setSiteOpen(false);
                  }}
                  style={s.dropdownItem}
                >
                  <Text style={[s.dropdownItemText, selectedSiteId === site.id && s.dropdownItemTextActive]}>{site.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>Role</Text>
          <TouchableOpacity onPress={() => setGroupOpen((value) => !value)} style={s.selector}>
            <Text style={s.selectorText}>{selectedGroup?.name || 'Select group'}</Text>
            <ChevronDown size={16} color="#6b7280" />
          </TouchableOpacity>
          {groupOpen ? (
            <View style={s.dropdown}>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  onPress={() => {
                    setSelectedGroupId(group.id);
                    setGroupOpen(false);
                  }}
                  style={s.dropdownItem}
                >
                  <Text style={[s.dropdownItemText, selectedGroupId === group.id && s.dropdownItemTextActive]}>{group.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>Full name</Text>
          <TextInput value={name} onChangeText={setName} style={s.input} placeholder="Full name" placeholderTextColor="#9ca3af" />
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>Company name</Text>
          <TextInput value={companyName} onChangeText={setCompanyName} style={s.input} placeholder="Company name" placeholderTextColor="#9ca3af" />
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={s.input}
            placeholder="visitor@example.com"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>Phone</Text>
          <TextInput value={phone} onChangeText={setPhone} style={s.input} placeholder="Phone number" placeholderTextColor="#9ca3af" keyboardType="phone-pad" />
        </View>

        <View style={s.row}>
          <View style={[s.inputGroup, s.rowItem]}>
            <Text style={s.label}>Arrival date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[s.selector, { gap: 8 }]}
            >
              <Calendar size={16} color="#6b7280" />
              <Text style={[s.selectorText, { flex: 1 }]}>{arrivalDateDisplay}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={arrivalDateObj}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                minimumDate={new Date()}
                onChange={(event, selected) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selected) setArrivalDateObj(selected);
                }}
              />
            )}
          </View>
          <View style={[s.inputGroup, s.rowItem]}>
            <Text style={s.label}>Arrival time</Text>
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              style={[s.selector, { gap: 8 }]}
            >
              <Clock size={16} color="#6b7280" />
              <Text style={[s.selectorText, { flex: 1 }]}>{arrivalTimeDisplay}</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={arrivalTimeObj}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
                is24Hour={false}
                onChange={(event, selected) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (selected) setArrivalTimeObj(selected);
                }}
              />
            )}
          </View>
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>Description</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            style={[s.input, s.notesInput]}
            multiline
            placeholder="Reason for visit or any instructions"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Send invite email</Text>
            <Text style={s.helperText}>Enabled only when an email address is provided.</Text>
          </View>
          <Switch value={sendInvite} onValueChange={setSendInvite} disabled={!email.trim()} trackColor={{ true: '#2b4594', false: '#d1d5db' }} />
        </View>

        <TouchableOpacity onPress={handleSubmit} disabled={saving} style={[s.submitBtn, saving && { opacity: 0.7 }]}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Create pre-registration</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  // Extra bottom padding so the submit button isn't hidden behind the tab bar on smaller screens
  formWrap: { padding: 20, paddingBottom: 120 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#111827',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  selectorText: { fontSize: 15, color: '#111827' },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  dropdownItemText: { color: '#111827', fontSize: 15 },
  dropdownItemTextActive: { color: '#2b4594', fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12 },
  rowItem: { flex: 1 },
  notesInput: { minHeight: 96, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
  },
  helperText: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  submitBtn: {
    backgroundColor: '#2b4594',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  avatarBig: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#2b4594',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  successName: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
  summaryCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { fontSize: 15, color: '#111827', fontWeight: '600', marginBottom: 12 },
  doneBtn: {
    width: '100%',
    backgroundColor: '#2b4594',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default PreregisterScreen;
