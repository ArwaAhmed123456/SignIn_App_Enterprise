import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Switch } from 'react-native';
import { Plus, User, ChevronDown, Map, Bell, Globe, Ruler, LogOut } from 'lucide-react-native';

const ProfileScreen = ({ navigation }) => {
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

      <ScrollView className="flex-1 px-4 pt-4 pb-8">
        
        {/* Profile Card */}
        <TouchableOpacity 
          className="flex-row items-center justify-between bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm"
          onPress={() => navigation.navigate('QRCode')}
        >
          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-gray-100 rounded-full items-center justify-center mr-4">
              <User size={28} color="#9ca3af" />
            </View>
            <View>
              <Text className="text-xl font-bold text-gray-900">Arwa Ahmed</Text>
              <Text className="text-base text-gray-500">Employees</Text>
            </View>
          </View>
          <ChevronDown size={24} color="#9ca3af" />
        </TouchableOpacity>

        {/* Permissions */}
        <TouchableOpacity className="flex-row items-center justify-between bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm">
          <View>
            <Text className="text-lg font-bold text-gray-900">Permissions</Text>
            <Text className="text-sm text-gray-500 mt-1">Your Companion permissions</Text>
          </View>
          <ChevronDown size={24} color="#9ca3af" />
        </TouchableOpacity>

        {/* Theme Settings */}
        <View className="bg-white rounded-2xl mb-4 border border-gray-100 shadow-sm overflow-hidden">
          <View className="flex-row bg-gray-100/50">
            <TouchableOpacity className="flex-1 py-4 items-center bg-white rounded-xl shadow-sm m-1">
              <Text className="text-base font-bold text-gray-900">System</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 py-4 items-center justify-center m-1">
              <Text className="text-base text-gray-600">Light</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 py-4 items-center justify-center m-1">
              <Text className="text-base text-gray-600">Dark</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <View className="bg-white rounded-2xl mb-4 border border-gray-100 shadow-sm overflow-hidden">
          <View className="p-4 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900">Notifications</Text>
            <Text className="text-sm text-gray-500 mt-1">Stay up to date</Text>
          </View>
          <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <Text className="text-base text-gray-800">Host notifications</Text>
            <Switch value={true} trackColor={{ true: '#2b4594', false: '#e5e7eb' }} />
          </View>
          <View className="p-4">
            <Text className="text-base font-bold text-gray-900">Notification Type</Text>
            <Text className="text-sm text-gray-500 mt-1 mb-3">Select how you would like to be notified</Text>
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-base text-gray-800">Push</Text>
              <Text className="text-base font-bold text-gray-900">Manage</Text>
            </View>
          </View>
        </View>

        {/* Map */}
        <View className="bg-white rounded-2xl mb-4 border border-gray-100 shadow-sm overflow-hidden">
          <View className="p-4 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900">Map</Text>
          </View>
          <View className="flex-row items-center justify-between p-4">
            <Text className="text-base text-gray-800">Show map on today tab</Text>
            <Switch value={false} />
          </View>
        </View>

        {/* Language */}
        <View className="bg-white rounded-2xl mb-4 border border-gray-100 shadow-sm p-4">
          <Text className="text-lg font-bold text-gray-900">Language</Text>
          <Text className="text-sm text-gray-500 mt-1 mb-3">Set your default language</Text>
          <TouchableOpacity className="flex-row items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-white">
            <Text className="text-base text-gray-800">English (UK)</Text>
            <ChevronDown size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Distance Units */}
        <View className="bg-white rounded-2xl mb-4 border border-gray-100 shadow-sm p-4">
          <Text className="text-lg font-bold text-gray-900">Distance Units</Text>
          <Text className="text-sm text-gray-500 mt-1 mb-3">Set your default distance type</Text>
          <TouchableOpacity className="flex-row items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-white">
            <Text className="text-base text-gray-800">Metric (km)</Text>
            <ChevronDown size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Disconnect */}
        <TouchableOpacity className="bg-white border border-gray-300 rounded-xl py-4 items-center justify-center mb-6">
          <Text className="text-base font-bold text-gray-900">Disconnect account</Text>
        </TouchableOpacity>

        <Text className="text-center text-gray-400 text-sm mb-12">Version 3.26.0 (302872)</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
