import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// Icons
import { CheckCircle, Calendar as CalendarIcon, ShieldCheck, User } from 'lucide-react-native';

// Old Screens
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import MobileForm from './src/screens/MobileForm';
import WorkerListScreen from './src/screens/WorkerListScreen';
import GuardDashboard from './src/screens/GuardDashboard';
import ProjectDetails from './src/screens/ProjectDetails';
import MobileActivationScreen from './src/screens/MobileActivationScreen';
import DeliveryScreen from './src/screens/DeliveryScreen';

// New Screens
import TodayScreen from './src/screens/TodayScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import EvacuationScreen from './src/screens/EvacuationScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import QRCodeScreen from './src/screens/QRCodeScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2b4594',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#ffffff'
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen 
        name="Today" 
        component={TodayScreen} 
        options={{
          tabBarIcon: ({ color }) => <CheckCircle color={color} size={28} />
        }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen} 
        options={{
          tabBarIcon: ({ color }) => <CalendarIcon color={color} size={28} />
        }}
      />
      <Tab.Screen 
        name="EvacuationTab" 
        component={EvacuationScreen} 
        options={{
          tabBarIcon: ({ color }) => <ShieldCheck color={color} size={28} />
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color }) => <User color={color} size={28} />
        }}
      />
    </Tab.Navigator>
  );
};

const Navigation = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2b4594" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Main Tab Navigator */}
        <Stack.Screen name="MainTabs" component={MainTabs} />
        
        {/* Modal / Push Screens */}
        <Stack.Screen name="QRCode" component={QRCodeScreen} options={{ presentation: 'modal' }} />

        {/* Keeping old screens in stack just in case they are still needed */}
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="WorkerListScreen" component={WorkerListScreen} />
        <Stack.Screen name="MobileForm" component={MobileForm} />
        <Stack.Screen name="GuardDashboard" component={GuardDashboard} />
        <Stack.Screen name="MobileActivation" component={MobileActivationScreen} />
        <Stack.Screen name="Delivery" component={DeliveryScreen} />
        <Stack.Screen name="ProjectDetails" component={ProjectDetails} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
