import { useCallback } from 'react';
import { StatusBar, StatusBarStyle } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Sets the status-bar icon style whenever the host screen gains focus.
 *
 * Android 15+ enforces edge-to-edge, so `StatusBar backgroundColor` is a no-op
 * and the bar is transparent over the screen. We therefore pick the icon color
 * per screen: `dark-content` on cream/light tops, `light-content` on cobalt tops.
 */
export default function FocusAwareStatusBar({ barStyle }: { barStyle: StatusBarStyle }) {
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(barStyle, true);
    }, [barStyle]),
  );
  return null;
}
