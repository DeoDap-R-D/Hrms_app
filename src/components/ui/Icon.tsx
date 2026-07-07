import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';

export type IconSet = 'mci' | 'feather';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  set?: IconSet;
  style?: StyleProp<TextStyle>;
}

/**
 * Centralized icon component. Defaults to Material Community Icons (large set);
 * `set="feather"` gives the clean Lucide-style line icons. Routing all icons
 * through here means the icon library can be swapped in one place later
 * (e.g. to lucide-react-native) without touching screens.
 */
export default function Icon({ name, size = 22, color, set = 'mci', style }: IconProps) {
  const Cmp = set === 'feather' ? Feather : MaterialCommunityIcons;
  return <Cmp name={name} size={size} color={color} style={style} />;
}
