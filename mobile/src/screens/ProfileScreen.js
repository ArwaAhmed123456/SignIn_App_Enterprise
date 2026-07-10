import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, User, ChevronDown } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  // Settings state
  const [theme, setTheme]               = useState('Dark');
  const [autoSignIn, setAutoSignIn]     = useState(false);
  const [autoReminder, setAutoReminder] = useState(false);
  const [hostNotifs, setHostNotifs]     = useState(true);
  const [showMap, setShowMap]           = useState(true);
  const [language, setLanguage]         = useState('English (UK)');
  const [distanceUnit, setDistanceUnit] = useState('Metric (km)');
  const [startOfWeek, setStartOfWeek]   = useState('Monday');
  const [weeklyHours, setWeeklyHours]   = useState('40');
  const [reminders, setReminders]       = useState([]);

  const memberName = user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null) || user?.email?.split('@')[0] || 'Member';
  const group      = user?.group || user?.role || 'Employees';
  const org        = user?.organization || 'Observant Security Services';

  const handleDisconnect = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const BG  = '#1c1c1e';
  const BG2 = '#2c2c2e';
  const T1  = '#ffffff';
  const T2  = '#ababab';
  const BD  = '#3a3a3c';

  const Card = ({ children, style }) => (
    <View style={[{ backgroundColor: BG2, borderRadius: 14, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: BD }, style]}>
      {children}
    </View>
  );

  const Row = ({ label, value, onPress, right }) => (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BD }}>
      <Text style={{ fontSize: 15, color: T1 }}>{label}</Text>
      {right || (value ? <Text style={{ fontSize: 15, color: T2 }}>{value}</Text> : null)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[{ flex: 1 }, { backgroundColor: BG }]} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: BG }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: T1 }}>{org}</Text>
        <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: BD, alignItems: 'center', justifyContent: 'center', backgroundColor: BG2 }}>
          <Plus size={20} color={T1} />
        </TouchableOpacity>
      </View>

      {/* Extra bottom padding so content (e.g., Log Out) is not hidden behind the bottom tab bar */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 12 }} contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}>

        {/* Profile card */}
        <Card>
          <TouchableOpacity onPress={() => navigation.navigate('QRCode')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#3a3a3c', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <User size={26} color="#9ca3af" />
              </View>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '700', color: T1 }}>{memberName}</Text>
                <Text style={{ fontSize: 14, color: T2, marginTop: 2 }}>{group}</Text>
              </View>
            </View>
            <ChevronDown size={20} color={T2} />
          </TouchableOpacity>
        </Card>

        {/* Permissions */}
        <Card>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: T1 }}>Permissions</Text>
              <Text style={{ fontSize: 13, color: T2, marginTop: 2 }}>Your Companion permissions</Text>
            </View>
            <ChevronDown size={20} color={T2} />
          </TouchableOpacity>
        </Card>

        {/* Theme */}
        <Card>
          <View style={{ flexDirection: 'row', margin: 6, backgroundColor: '#1c1c1e', borderRadius: 10 }}>
            {['System', 'Light', 'Dark'].map(t => (
              <TouchableOpacity key={t} onPress={() => setTheme(t)}
                style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: theme === t ? '#3a3a3c' : 'transparent' }}>
                <Text style={{ fontSize: 14, fontWeight: theme === t ? '700' : '400', color: theme === t ? T1 : T2 }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Auto sign in/out */}
        <Card>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: BD }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: T1 }}>Automatically sign in/out</Text>
            <Text style={{ fontSize: 13, color: T2, marginTop: 2 }}>Automatically sign in and out as you arrive and leave.</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 15, color: T1 }}>Enable auto sign in/out</Text>
            <Switch value={autoSignIn} onValueChange={setAutoSignIn} trackColor={{ true: '#2b4594', false: '#3a3a3c' }} thumbColor="#fff" />
          </View>
        </Card>

        {/* Auto reminder */}
        <Card>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: BD }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: T1 }}>Auto reminder</Text>
            <Text style={{ fontSize: 13, color: T2, marginTop: 2 }}>Get a reminder automatically as you arrive or leave</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 15, color: T1 }}>Enable auto reminder</Text>
            <Switch value={autoReminder} onValueChange={setAutoReminder} trackColor={{ true: '#2b4594', false: '#3a3a3c' }} thumbColor="#fff" />
          </View>
        </Card>

        {/* Scheduled Reminders */}
        <Card>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: BD }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: T1 }}>Scheduled Reminders</Text>
            <Text style={{ fontSize: 13, color: T2, marginTop: 2 }}>Set reminders to sign in or sign out</Text>
          </View>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 22, color: T2 }}>⊕</Text>
            <Text style={{ fontSize: 15, color: T1 }}>Add Reminder</Text>
          </TouchableOpacity>
        </Card>

        {/* Notifications */}
        <Card>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: BD }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: T1 }}>Notifications</Text>
            <Text style={{ fontSize: 13, color: T2, marginTop: 2 }}>Stay up to date</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BD }}>
            <Text style={{ fontSize: 15, color: T1 }}>Host notifications</Text>
            <Switch value={hostNotifs} onValueChange={setHostNotifs} trackColor={{ true: '#2b4594', false: '#3a3a3c' }} thumbColor="#fff" />
          </View>
          <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: T1, marginBottom: 4 }}>Notification Type</Text>
            <Text style={{ fontSize: 13, color: T2, marginBottom: 10 }}>Select how you would like to be notified</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, color: T1 }}>Push</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: T1 }}>Manage</Text>
            </View>
          </View>
        </Card>

        {/* Hours */}
        <Card>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: BD }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: T1 }}>Hours</Text>
            <Text style={{ fontSize: 13, color: T2, marginTop: 2 }}>Set your working hours.</Text>
          </View>
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 14, color: T2, marginBottom: 6 }}>Start of week</Text>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: BD, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14, backgroundColor: BG }}>
              <Text style={{ fontSize: 15, color: T1 }}>{startOfWeek}</Text>
              <ChevronDown size={16} color={T2} />
            </TouchableOpacity>
            <Text style={{ fontSize: 14, color: T2, marginBottom: 6 }}>Weekly hours</Text>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: BD, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: BG }}>
              <Text style={{ fontSize: 15, color: T1 }}>{weeklyHours} hours</Text>
              <ChevronDown size={16} color={T2} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Map */}
        <Card>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: BD }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: T1 }}>Map</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 15, color: T1 }}>Show map on today tab</Text>
            <Switch value={showMap} onValueChange={setShowMap} trackColor={{ true: '#2b4594', false: '#3a3a3c' }} thumbColor="#fff" />
          </View>
        </Card>

        {/* Language */}
        <Card style={{ padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: T1, marginBottom: 4 }}>Language</Text>
          <Text style={{ fontSize: 13, color: T2, marginBottom: 12 }}>Set your default language</Text>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: BD, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: BG }}>
            <Text style={{ fontSize: 15, color: T1 }}>{language}</Text>
            <ChevronDown size={16} color={T2} />
          </TouchableOpacity>
        </Card>

        {/* Distance Units */}
        <Card style={{ padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: T1, marginBottom: 4 }}>Distance Units</Text>
          <Text style={{ fontSize: 13, color: T2, marginBottom: 12 }}>Set your default distance type</Text>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: BD, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: BG }}>
            <Text style={{ fontSize: 15, color: T1 }}>{distanceUnit}</Text>
            <ChevronDown size={16} color={T2} />
          </TouchableOpacity>
        </Card>

        {/* Log Out */}
        <TouchableOpacity onPress={handleDisconnect}
          style={{ backgroundColor: '#ff3b30', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#ffffff' }}>Log Out</Text>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', color: T2, fontSize: 13, marginBottom: 8 }}>Version 1.1.0 (10001)</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
