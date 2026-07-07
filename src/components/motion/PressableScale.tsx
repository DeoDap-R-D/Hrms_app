import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  /** Scale at the pressed state. */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
}

/** Pressable with a spring scale-down for tactile press feedback. */
export default function PressableScale({
  children,
  scaleTo = 0.97,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();

  return (
    <Pressable
      onPressIn={e => {
        animate(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={e => {
        animate(1);
        onPressOut?.(e);
      }}
      {...rest}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}
