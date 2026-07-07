import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  /** Stagger index — multiplies the base delay for list entrance. */
  index?: number;
  delay?: number;
  duration?: number;
  /** Vertical offset to rise from (px). */
  offset?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Lightweight entrance animation (fade + rise). Built on RN Animated — no
 * native dependency. Use `index` on list items for a staggered reveal.
 */
export default function FadeInView({
  children,
  index = 0,
  delay = 0,
  duration = 320,
  offset = 10,
  style,
}: FadeInViewProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startDelay = delay + Math.min(index, 8) * 45;
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay: startDelay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [progress, delay, index, duration]);

  return (
    <Animated.View
      style={[
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [offset, 0],
              }),
            },
          ],
        },
        style,
      ]}>
      {children}
    </Animated.View>
  );
}
