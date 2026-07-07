import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { FocusAwareStatusBar } from '../../components/ui';
import { ref } from '../../theme/refColors';

interface Accent {
  icon: string;
  color: string;
  pos: 'tl' | 'tr' | 'bl' | 'br';
}
interface Slide {
  key: string;
  icon: string;
  title: string;
  subtitle: string;
  accents: Accent[];
}

const SLIDES: Slide[] = [
  {
    key: 'attendance',
    icon: 'calendar-clock',
    title: 'Attendance at a Glance',
    subtitle: 'View your daily check-in and check-out times, working hours, and monthly attendance — all in one clean dashboard.',
    accents: [
      { icon: 'clock-check-outline', color: ref.orange, pos: 'tr' },
      { icon: 'calendar-check', color: ref.green, pos: 'bl' },
    ],
  },
  {
    key: 'work',
    icon: 'chart-box-outline',
    title: 'Your Work, Tracked',
    subtitle: 'Generate daily, monthly, periodic and yearly reports and follow your attendance and stats — right from your phone.',
    accents: [
      { icon: 'file-document-edit-outline', color: ref.amber, pos: 'tl' },
      { icon: 'chart-donut', color: ref.teal, pos: 'br' },
    ],
  },
  {
    key: 'leaves',
    icon: 'calendar-heart',
    title: 'Leaves & Profile, Simplified',
    subtitle: 'Apply for leave, check holidays, and manage your profile — everything you need in one place.',
    accents: [
      { icon: 'calendar-check', color: ref.blue, pos: 'tr' },
      { icon: 'account-circle-outline', color: ref.green, pos: 'bl' },
    ],
  },
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { width } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<any>(null);
  const [index, setIndex] = useState(0);

  const last = SLIDES.length - 1;
  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true });

  const goNext = () => {
    if (index < last) {
      const ni = index + 1;
      scrollRef.current?.scrollTo({ x: ni * width, animated: true });
      setIndex(ni);
    } else {
      onDone();
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <FocusAwareStatusBar barStyle="dark-content" />

      {/* Skip */}
      <View style={styles.topBar}>
        {index < last ? (
          <TouchableOpacity style={styles.skipBtn} onPress={onDone} hitSlop={hitSlop} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
            <Icon name="chevron-right" size={18} color={ref.textMuted} />
          </TouchableOpacity>
        ) : (
          <View style={styles.skipBtn} />
        )}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="fast"
        onScroll={onScroll}
        onMomentumScrollEnd={e => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}>
        {SLIDES.map((slide, i) => (
          <SlideView key={slide.key} slide={slide} i={i} width={width} scrollX={scrollX} />
        ))}
      </Animated.ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 22, 8], extrapolate: 'clamp' });
            const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
            return <Animated.View key={i} style={[styles.dot, { width: dotWidth, opacity }]} />;
          })}
        </View>

        <TouchableOpacity activeOpacity={0.9} onPress={goNext} style={styles.cta}>
          <Text style={styles.ctaText}>{index < last ? 'Next' : 'Get Started'}</Text>
          <Icon name={index < last ? 'arrow-right' : 'check'} size={20} color="#FFFFFF" style={styles.ctaIcon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SlideView({ slide, i, width, scrollX }: { slide: Slide; i: number; width: number; scrollX: Animated.Value }) {
  const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
  const imgScale = scrollX.interpolate({ inputRange, outputRange: [0.6, 1, 0.6], extrapolate: 'clamp' });
  const imgOpacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });
  const textTranslate = scrollX.interpolate({ inputRange, outputRange: [60, 0, 60], extrapolate: 'clamp' });
  const textOpacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={[styles.illustration, { opacity: imgOpacity, transform: [{ scale: imgScale }] }]}>
        <View style={styles.haloOuter} />
        <View style={styles.haloInner} />
        <LinearGradient colors={['#3B82F6', ref.blue, ref.blueDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconCircle}>
          <Icon name={slide.icon} size={92} color="#FFFFFF" />
        </LinearGradient>
        {slide.accents.map((a, idx) => {
          const posStyle = { tl: styles.accent_tl, tr: styles.accent_tr, bl: styles.accent_bl, br: styles.accent_br }[a.pos];
          return (
            <View key={idx} style={[styles.accent, posStyle]}>
              <Icon name={a.icon} size={22} color={a.color} />
            </View>
          );
        })}
      </Animated.View>

      <Animated.View style={[styles.textWrap, { opacity: textOpacity, transform: [{ translateY: textTranslate }] }]}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </Animated.View>
    </View>
  );
}

const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: { height: 44, justifyContent: 'center', paddingHorizontal: 20 },
  skipBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', paddingVertical: 4 },
  skipText: { fontSize: 15, fontWeight: '700', color: ref.textMuted },

  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },

  illustration: { width: 280, height: 280, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  haloOuter: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: ref.blueSoft, opacity: 0.5 },
  haloInner: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: ref.blueSoft },
  iconCircle: {
    width: 176,
    height: 176,
    borderRadius: 88,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ref.blue,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  accent: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  accent_tl: { top: 8, left: 16 },
  accent_tr: { top: 8, right: 16 },
  accent_bl: { bottom: 8, left: 16 },
  accent_br: { bottom: 8, right: 16 },

  textWrap: { alignItems: 'center', paddingHorizontal: 8 },
  title: { fontSize: 26, fontWeight: '800', color: ref.text, letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { fontSize: 15, color: ref.textMuted, textAlign: 'center', lineHeight: 23, marginTop: 12 },

  footer: { paddingHorizontal: 24, paddingBottom: 20 },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, height: 10 },
  dot: { height: 8, borderRadius: 4, backgroundColor: ref.blue, marginHorizontal: 4 },

  cta: {
    height: 56,
    borderRadius: 14,
    backgroundColor: ref.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  ctaIcon: { marginLeft: 8 },
});
