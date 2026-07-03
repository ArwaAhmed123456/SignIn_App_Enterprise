import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Plus } from 'lucide-react-native';

const TodayScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3 bg-white">
        <View className="flex-row items-center">
          {/* Mock Logo */}
          <View className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center -mr-3 z-10" />
          <View className="w-10 h-10 bg-primary rounded-full items-center justify-center opacity-80" />
        </View>
        <TouchableOpacity className="w-12 h-12 rounded-full border border-gray-200 items-center justify-center bg-white shadow-sm">
          <Plus size={24} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-400 text-base">No activity today</Text>
      </View>
    </SafeAreaView>
  );
};

export default TodayScreen;
