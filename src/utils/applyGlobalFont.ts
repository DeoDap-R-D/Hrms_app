/* eslint-disable @typescript-eslint/no-explicit-any */
import { Text, TextInput, StyleSheet } from 'react-native';

/**
 * Maps every fontWeight to the matching Poppins (Google Font) file. Android
 * renders a single custom family + synthetic bold poorly, so each weight points
 * at its own bundled TTF (android/app/src/main/assets/fonts/Poppins-*.ttf).
 */
const WEIGHT_TO_FAMILY: Record<string, string> = {
  '100': 'Poppins-Regular',
  '200': 'Poppins-Regular',
  '300': 'Poppins-Regular',
  '400': 'Poppins-Regular',
  normal: 'Poppins-Regular',
  '500': 'Poppins-Medium',
  '600': 'Poppins-SemiBold',
  '700': 'Poppins-Bold',
  bold: 'Poppins-Bold',
  '800': 'Poppins-ExtraBold',
  '900': 'Poppins-ExtraBold',
};

function familyFor(style: any): string {
  const flat = (StyleSheet.flatten(style) || {}) as { fontWeight?: string | number };
  const w = flat.fontWeight != null ? String(flat.fontWeight) : '400';
  return WEIGHT_TO_FAMILY[w] || 'Poppins-Regular';
}

/**
 * Applies Poppins app-wide by wrapping the render of Text / TextInput. The
 * injected family is placed *before* the element's own style, so any component
 * that sets its own fontFamily (e.g. react-native-vector-icons) keeps it; the
 * trailing `fontWeight: undefined` stops Android double-applying weight on top
 * of the already-weighted Poppins file. Call once at startup.
 */
export default function applyGlobalFont(): void {
  [Text, TextInput].forEach((Comp: any) => {
    if (!Comp || Comp.__poppinsPatched || typeof Comp.render !== 'function') return;
    const orig = Comp.render;
    Comp.__poppinsPatched = true;
    Comp.render = function patchedRender(this: any, props: any, ref: any) {
      const family = familyFor(props && props.style);
      const style = [{ fontFamily: family }, props && props.style, { fontWeight: undefined }];
      return orig.call(this, { ...props, style }, ref);
    };
  });
}
