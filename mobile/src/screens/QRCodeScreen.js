import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../context/AuthContext';

const QRCodeScreen = ({ navigation }) => {
  const { user } = useAuth();

  const memberId   = user?.id || user?.guard_id || user?.email || 'unknown';
  const memberName =
    user?.name ||
    (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null) ||
    user?.email ||
    'Member';
  const group    = user?.group || user?.role || 'Employee';
  const qrValue  = JSON.stringify({ id: memberId, name: memberName, group });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Drag handle */}
      <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#d1d5db' }} />
      </View>

      {/* Title */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>My QR Code</Text>
      </View>

      {/* QR Code centered */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 }}>
        <QRCode
          value={qrValue}
          size={240}
          color="#000000"
          backgroundColor="#ffffff"
          ecl="M"
        />
      </View>
    </SafeAreaView>
  );
};

export default QRCodeScreen;
