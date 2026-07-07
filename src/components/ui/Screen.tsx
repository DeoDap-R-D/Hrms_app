import React from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useResponsive } from '../../utils/responsive';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  background?: string;
  /** Fixed element (e.g. a GradientHeader app bar) rendered above the scroll. */
  header?: React.ReactNode;
}

export default function Screen({
  children,
  scroll = true,
  padded = true,
  refreshing,
  onRefresh,
  edges = ['top', 'left', 'right'],
  contentStyle,
  background,
  header,
}: ScreenProps) {
  const { colors, spacing } = useTheme();
  const { isTablet, maxWidth } = useResponsive();

  const inner = (
    <View
      style={[
        padded && { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
        isTablet && { maxWidth, width: '100%', alignSelf: 'center' },
        contentStyle,
      ]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: background ?? colors.bg }]}
      edges={edges}>
      {header}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.huge }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
                progressBackgroundColor={colors.surface}
              />
            ) : undefined
          }>
          {inner}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{inner}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});
