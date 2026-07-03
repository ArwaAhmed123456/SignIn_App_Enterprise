import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const QRCodeScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">My QR Code</Text>
      </View>
      <View className="flex-1 items-center justify-center">
        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <QRCode
            value="employee-arwa-ahmed-12345"
            size={250}
            color="black"
            backgroundColor="white"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default QRCodeScreen;
