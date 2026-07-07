import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppState } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';
import { getOnboardingSeen, setOnboardingSeen } from '../api/storage';
import { initNotifications, syncReminders, registerForegroundHandler } from '../utils/notifications';
import type { AppStackParamList } from './types';

import AppTabs from './AppTabs';
import LoginScreen from '../screens/auth/LoginScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

import PunchScreen from '../screens/punch/PunchScreen';
import PunchHistoryScreen from '../screens/punch/PunchHistoryScreen';
import CreateLeaveScreen from '../screens/leaves/CreateLeaveScreen';
import LeaveDetailScreen from '../screens/leaves/LeaveDetailScreen';
import WorkReportsScreen from '../screens/workreports/WorkReportsScreen';
import CreateWorkReportScreen from '../screens/workreports/CreateWorkReportScreen';
import DailyReportScreen from '../screens/reports/DailyReportScreen';
import MonthlyReportScreen from '../screens/reports/MonthlyReportScreen';
import PeriodicReportScreen from '../screens/reports/PeriodicReportScreen';
import PeriodicReportViewerScreen from '../screens/reports/PeriodicReportViewerScreen';
import YearlyReportScreen from '../screens/reports/YearlyReportScreen';
import YearlyReportViewerScreen from '../screens/reports/YearlyReportViewerScreen';
import ReportViewerScreen from '../screens/reports/ReportViewerScreen';
import ContactSupportScreen from '../screens/support/ContactSupportScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import TrackingScreen from '../screens/tracking/TrackingScreen';
import PoliciesScreen from '../screens/lookups/PoliciesScreen';
import LookupScreen from '../screens/lookups/LookupScreen';
import DepartmentsScreen from '../screens/lookups/DepartmentsScreen';
import UpdatePopup from '../components/UpdatePopup';
import { useAppUpdate } from '../hooks/useAppUpdate';

const Stack = createNativeStackNavigator<AppStackParamList>();

// Screens opened from the side drawer use a fade so the only visible motion is
// the drawer sliding away to reveal a page that is already in place — avoids the
// jarring "drawer slides out while the page also slides in from the right".
const fadeIn = { animation: 'fade' as const };

export default function RootNavigator() {
  const { bootstrapping, isAuthenticated } = useAuth();
  const { colors, isDark } = useTheme();

  // Version / update check.
  const [update, dismissUpdate] = useAppUpdate();

  // First-launch onboarding gate (null = still loading the flag).
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  useEffect(() => {
    getOnboardingSeen().then(setOnboarded);
  }, []);
  const finishOnboarding = useCallback(() => {
    setOnboarded(true);
    setOnboardingSeen();
  }, []);

  // Schedule the daily check-in / check-out reminders once signed in, and
  // re-sync whenever the app returns to the foreground.
  useEffect(() => {
    if (!isAuthenticated) return;
    // Request notification permission ONCE here (foreground, just after auth);
    // foreground re-syncs below only schedule and never re-request permission.
    initNotifications();
    syncReminders();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') syncReminders();
    });
    return () => sub.remove();
  }, [isAuthenticated]);

  // Handle reminders delivered while the app is in the foreground (record them
  // for the in-app Notifications screen / suppress if already punched).
  useEffect(() => registerForegroundHandler(), []);

  const navTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: '#FFFFFF',
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
      },
    };
  }, [isDark, colors]);

  return (
    <NavigationContainer theme={navTheme}>
      {bootstrapping || onboarded === null ? null : !isAuthenticated && !onboarded ? (
        <OnboardingScreen onDone={finishOnboarding} />
      ) : !isAuthenticated ? (
        <LoginScreen />
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FFFFFF' },
            animation: 'slide_from_right',
          }}>
          <Stack.Screen name="Tabs" component={AppTabs} />
          <Stack.Screen name="Punch" component={PunchScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="PunchHistory" component={PunchHistoryScreen} />
          <Stack.Screen name="CreateLeave" component={CreateLeaveScreen} />
          <Stack.Screen name="LeaveDetail" component={LeaveDetailScreen} />
          <Stack.Screen name="WorkReports" component={WorkReportsScreen} options={fadeIn} />
          <Stack.Screen name="CreateWorkReport" component={CreateWorkReportScreen} />
          <Stack.Screen name="DailyReport" component={DailyReportScreen} options={fadeIn} />
          <Stack.Screen name="MonthlyReport" component={MonthlyReportScreen} options={fadeIn} />
          <Stack.Screen name="PeriodicReport" component={PeriodicReportScreen} options={fadeIn} />
          <Stack.Screen name="PeriodicReportViewer" component={PeriodicReportViewerScreen} />
          <Stack.Screen name="YearlyReport" component={YearlyReportScreen} options={fadeIn} />
          <Stack.Screen name="YearlyReportViewer" component={YearlyReportViewerScreen} />
          <Stack.Screen name="ReportViewer" component={ReportViewerScreen} />
          <Stack.Screen name="ContactSupport" component={ContactSupportScreen} options={fadeIn} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Tracking" component={TrackingScreen} />
          <Stack.Screen name="Policies" component={PoliciesScreen} />
          <Stack.Screen name="Departments" component={DepartmentsScreen} />
          <Stack.Screen name="Lookup" component={LookupScreen} options={fadeIn} />
        </Stack.Navigator>
      )}

      <UpdatePopup state={update} onDismiss={dismissUpdate} />
    </NavigationContainer>
  );
}
