import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Icon from '../components/ui/Icon';
import { ref } from '../theme/refColors';

const ICONS: Record<string, { active: string; inactive: string }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Attendance: { active: 'calendar-check', inactive: 'calendar-check-outline' },
  Leave: { active: 'calendar-clock', inactive: 'calendar-clock-outline' },
  Profile: { active: 'account-circle', inactive: 'account-circle-outline' },
};

/**
 * Flat white bottom navigation matching the reference design: each tab shows an
 * outline icon above its label, the active tab rendered in brand blue and the
 * others in muted grey.
 */
export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.host, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title ?? route.name;
        const set = ICONS[route.name] ?? { active: 'circle', inactive: 'circle-outline' };
        const color = focused ? ref.blue : ref.tabInactive;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tab} android_ripple={{ color: 'transparent' }}>
            <Icon name={focused ? set.active : set.inactive} size={24} color={color} />
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11.5, fontWeight: '600', marginTop: 4, letterSpacing: 0.1 },
});
