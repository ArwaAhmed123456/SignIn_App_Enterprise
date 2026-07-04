import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

const EvacuationScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Title */}
      <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827' }}>Evacuations</Text>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {/* Card */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>My evacuation points</Text>
          </View>

          <View style={{ padding: 12 }}>
            {/* Info row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, padding: 12, gap: 10 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#2b4594', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#2b4594', fontWeight: '700', fontSize: 14 }}>!</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 }}>
                Sign in to see evacuation points for this location
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EvacuationScreen;
