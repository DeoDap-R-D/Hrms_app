import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Icon from './Icon';
import { useTheme } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: string;
  error?: string;
  secure?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function Input({
  label,
  icon,
  error,
  secure,
  containerStyle,
  style: inputStyle,
  ...rest
}: InputProps) {
  const { colors, radius, spacing } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secure);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: focused ? colors.surface : colors.surfaceAlt,
            borderColor,
            borderRadius: radius.md,
          },
          focused && { borderWidth: 1.5 },
        ]}>
        {icon ? (
          <Icon
            name={icon}
            size={20}
            color={focused ? colors.primary : colors.textSubtle}
            style={{ marginRight: spacing.sm }}
          />
        ) : null}
        <TextInput
          style={[styles.input, { color: colors.text }, inputStyle]}
          placeholderTextColor={colors.textSubtle}
          secureTextEntry={hidden}
          onFocus={e => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
        {secure ? (
          <TouchableOpacity onPress={() => setHidden(h => !h)} hitSlop={hitSlop}>
            <Icon name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSubtle} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 14 },
  error: { fontSize: 12, marginTop: 6, marginLeft: 2 },
});
