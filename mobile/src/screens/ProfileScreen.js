import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Switch, Alert } from 'react-native';
import { Plus, User, Phone, ChevronDown } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [showMap, setShowMap]                 = useState(false);
  const [theme, setTheme]                     = useState('System');

  // Resolve display name from whatever shape the user object takes
  const memberName =
    user?.name ||
    (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null) ||
    user?.email?.split('@')[0] ||
    'Member';
  const group = user?.group || user?.role || 'Employees';
  const phone  = user?.phone || null;

  const handleDisconnect = () => {
    Alert.alert('Disconnect account', 'Are you sure you want to disconnect?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: logout },
    ]);
  };

  const Card = ({ children, style }) => (
    <View style={[{ backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' }, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      {/* Header — overlapping circles logo (matches Sign In App companion) */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#4ade80', marginRight: -10, zIndex: 1 }} />
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#2b4594', opacity: 0.85 }} />
        </View>
        <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
          <Plus size={22} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 12, paddingTop: 12 }} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Profile card */}
        <Card>
          <TouchableOpacity
            onPress={() => navigation.navigate('QRCode')}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <User size={26} color="#9ca3af" />
              </View>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827' }}>{memberName}</Text>
                <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>{group}</Text>
                {phone ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                    <Phone size={12} color="#9ca3af" />
                    <Text style={{ fontSize: 13, color: '#9ca3af' }}>{phone}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <ChevronDown size={22} color="#9ca3af" />
          </TouchableOpacity>
        </Card>

        {/* Permissions */}
        <Card>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Permissions</Text>
              <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Your Companion permissions</Text>
            </View>
            <ChevronDown size={22} color="#9ca3af" />
          </TouchableOpacity>
        </Card>

        {/* Theme toggle */}
        <Card>
          <View style={{ flexDirection: 'row', margin: 4, backgroundColor: '#f3f4f6', borderRadius: 12 }}>
            {['System', 'Light', 'Dark'].map(t => (
              <TouchableOpacity key={t} onPress={() => setTheme(t)}
                style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10,
                  backgroundColor: theme === t ? '#ffffff' : 'transparent',
                  shadowColor: theme === t ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: theme === t ? 2 : 0 }}>
                <Text style={{ fontSize: 14, fontWeight: theme === t ? '700' : '400', color: theme === t ? '#111827' : '#6b7280' }}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Notifications */}
        <Card>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Notifications</Text>
            <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Stay up to date</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 15, color: '#1f2937' }}>Host notifications</Text>
            <Switch
              value={notificationsOn}
              onValueChange={setNotificationsOn}
              trackColor={{ true: '#4ade80', false: '#e5e7eb' }}
              thumbColor="#ffffff"
            />
          </View>
        </Card>

        {/* Notification Type */}
        <Card>
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Notification Type</Text>
            <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2, marginBottom: 14 }}>Select how you would like to be notified</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, color: '#1f2937' }}>Push</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Manage</Text>
            </View>
          </View>
        </Card>

        {/* Map */}
        <Card>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Map</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 15, color: '#1f2937' }}>Show map on today tab</Text>
            <Switch
              value={showMap}
              onValueChange={setShowMap}
              trackColor={{ true: '#4ade80', false: '#e5e7eb' }}
              thumbColor="#ffffff"
            />
          </View>
        </Card>

        {/* Language */}
        <Card style={{ padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Language</Text>
          <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2, marginBottom: 12 }}>Set your default language</Text>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 }}>
            <Text style={{ fontSize: 15, color: '#1f2937' }}>English (UK)</Text>
            <ChevronDown size={18} color="#6b7280" />
          </TouchableOpacity>
        </Card>

        {/* Distance Units */}
        <Card style={{ padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Distance Units</Text>
          <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2, marginBottom: 12 }}>Set your default distance type</Text>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 }}>
            <Text style={{ fontSize: 15, color: '#1f2937' }}>Metric (km)</Text>
            <ChevronDown size={18} color="#6b7280" />
          </TouchableOpacity>
        </Card>

        {/* Disconnect */}
        <TouchableOpacity onPress={handleDisconnect}
          style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Disconnect account</Text>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginBottom: 8 }}>Version 1.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
