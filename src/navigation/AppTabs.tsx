import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { AppTabParamList } from './types';
import CustomTabBar from './CustomTabBar';

import HomeScreen from '../screens/home/HomeScreen';
import AttendanceScreen from '../screens/punch/AttendanceScreen';
import LeavesScreen from '../screens/leaves/LeavesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#FFFFFF' } }}
      tabBar={props => <CustomTabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} options={{ title: 'Attendance' }} />
      <Tab.Screen name="Leave" component={LeavesScreen} options={{ title: 'Leave' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
