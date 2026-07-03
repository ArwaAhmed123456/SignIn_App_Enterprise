import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

const EvacuationScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 py-4 bg-white">
        <Text className="text-2xl font-bold text-gray-900">Evacuations</Text>
      </View>
      
      <View className="p-4">
        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <View className="p-4 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900">My evacuation points</Text>
          </View>
          <View className="p-4 bg-gray-50/50">
            <View className="flex-row items-center p-3 bg-gray-100 rounded-xl">
              <AlertCircle size={20} color="#2b4594" className="mr-3" />
              <Text className="text-base text-gray-800 flex-1">
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
