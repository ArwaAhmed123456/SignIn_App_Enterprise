import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Plus, Calendar, ChevronDown } from 'lucide-react-native';

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState(3);

  const days = [
    { day: 'W', date: 1 },
    { day: 'T', date: 2 },
    { day: 'F', date: 3 },
    { day: 'S', date: 4 },
    { day: 'S', date: 5 },
    { day: 'M', date: 6 },
    { day: 'T', date: 7 },
  ];

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

      {/* Month Selector */}
      <View className="flex-row items-center justify-between px-4 mt-2">
        <TouchableOpacity className="flex-1 flex-row items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-white mr-2">
          <Text className="text-lg font-medium text-gray-800">July 2026</Text>
          <ChevronDown size={20} color="#6b7280" />
        </TouchableOpacity>
        <TouchableOpacity className="w-14 h-14 border border-gray-200 rounded-xl items-center justify-center bg-white">
          <Calendar size={22} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {/* Week View */}
      <View className="flex-row justify-between px-2 mt-4 bg-white py-4 border-b border-gray-100 shadow-sm">
        {days.map((item, index) => {
          const isSelected = selectedDate === item.date;
          return (
            <TouchableOpacity 
              key={index}
              onPress={() => setSelectedDate(item.date)}
              className={`items-center justify-center w-12 py-3 rounded-full ${isSelected ? 'bg-primary' : 'bg-transparent'}`}
            >
              <Text className={`text-xs font-medium mb-1 ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                {item.day}
              </Text>
              <Text className={`text-base font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                {item.date}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <View className="flex-1 items-center pt-8">
        <Text className="text-gray-400 text-base">No activity today</Text>
      </View>
    </SafeAreaView>
  );
};

export default CalendarScreen;
