import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../../theme';

export interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerValue?: string;
  centerLabel?: string;
  /** Override the center value colour (defaults to theme text). */
  centerColor?: string;
  /** Override the center label colour (defaults to theme muted). */
  centerLabelColor?: string;
}

function DonutChart({
  segments,
  size = 180,
  strokeWidth = 22,
  centerValue,
  centerLabel,
  centerColor,
  centerLabelColor,
}: DonutChartProps) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);

  let offsetAccum = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={-90} originX={size / 2} originY={size / 2}>
          {/* Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.surfaceAlt}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {total > 0 &&
            segments.map((seg, i) => {
              const frac = Math.max(0, seg.value) / total;
              const dash = frac * circumference;
              const gap = circumference - dash;
              const circle = (
                <Circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={-offsetAccum}
                />
              );
              offsetAccum += dash;
              return circle;
            })}
        </G>
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.centerValue, { color: centerColor ?? colors.text }]}>{centerValue ?? String(total)}</Text>
        {centerLabel ? <Text style={[styles.centerLabel, { color: centerLabelColor ?? colors.textMuted }]}>{centerLabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  centerValue: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  centerLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
});

export default React.memo(DonutChart);
