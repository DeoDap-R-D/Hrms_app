import React, { useEffect, useRef } from 'react';
import { View, Animated, PanResponder, StyleSheet, LayoutChangeEvent } from 'react-native';

interface ZoomableViewProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
}

/**
 * Self-contained pinch-zoom + pan canvas (no native deps, no parent ScrollView).
 * - One finger  → pan (works at any zoom, so it doubles as scrolling).
 * - Two fingers → pinch zoom.
 * - Double tap  → reset to fit.
 * Panning is clamped to the content bounds so nothing can be dragged off-screen.
 */
export default function ZoomableView({ children, minScale = 1, maxScale = 5 }: ZoomableViewProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;

  const g = useRef({
    s: 1,
    tx: 0,
    ty: 0,
    startS: 1,
    startTx: 0,
    startTy: 0,
    startDist: 0,
    startMidX: 0,
    startMidY: 0,
    startTouchX: 0,
    startTouchY: 0,
    lastCount: 0,
    lastTap: 0,
    VW: 0,
    VH: 0,
    CW: 0,
    CH: 0,
  }).current;

  useEffect(() => {
    const a = scale.addListener(({ value }) => (g.s = value));
    const b = tx.addListener(({ value }) => (g.tx = value));
    const c = ty.addListener(({ value }) => (g.ty = value));
    return () => {
      scale.removeListener(a);
      tx.removeListener(b);
      ty.removeListener(c);
    };
  }, [scale, tx, ty, g]);

  const dist = (t: any[]) => Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);

  // Max translate (in pre-scale units) that keeps the scaled content within the
  // viewport; on-screen offset = translate * scale.
  const maxT = (content: number, view: number, s: number) => Math.max(0, (content * s - view) / 2) / s;
  const clampX = (v: number, s: number) => {
    const m = maxT(g.CW, g.VW, s);
    return Math.max(-m, Math.min(m, v));
  };
  const clampY = (v: number, s: number) => {
    const m = maxT(g.CH, g.VH, s);
    return Math.max(-m, Math.min(m, v));
  };
  const setPos = (x: number, y: number, s: number) => {
    tx.setValue(clampX(x, s));
    ty.setValue(clampY(y, s));
  };

  const rebase = (t: any[]) => {
    g.startS = g.s;
    g.startTx = g.tx;
    g.startTy = g.ty;
    if (t.length >= 2) {
      g.startDist = dist(t);
      g.startMidX = (t[0].pageX + t[1].pageX) / 2;
      g.startMidY = (t[0].pageY + t[1].pageY) / 2;
    } else {
      g.startTouchX = t[0].pageX;
      g.startTouchY = t[0].pageY;
    }
    g.lastCount = t.length;
  };

  const reset = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: minScale, useNativeDriver: true, bounciness: 3 }),
      Animated.spring(tx, { toValue: 0, useNativeDriver: true, bounciness: 3 }),
      Animated.spring(ty, { toValue: 0, useNativeDriver: true, bounciness: 3 }),
    ]).start();
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: e => {
        const t = e.nativeEvent.touches;
        g.lastCount = 0;
        if (t.length < 2) {
          const now = Date.now();
          if (now - g.lastTap < 280) reset();
          g.lastTap = now;
        }
      },
      onPanResponderMove: e => {
        const t = e.nativeEvent.touches;
        if (t.length === 0) return;
        if (t.length !== g.lastCount) rebase(t);

        if (t.length >= 2) {
          let ns = g.startS * (dist(t) / (g.startDist || dist(t)));
          ns = Math.max(minScale, Math.min(maxScale, ns));
          scale.setValue(ns);
          const midX = (t[0].pageX + t[1].pageX) / 2;
          const midY = (t[0].pageY + t[1].pageY) / 2;
          setPos(g.startTx + (midX - g.startMidX) / ns, g.startTy + (midY - g.startMidY) / ns, ns);
        } else {
          const ns = g.s;
          setPos(g.startTx + (t[0].pageX - g.startTouchX) / ns, g.startTy + (t[0].pageY - g.startTouchY) / ns, ns);
        }
      },
      onPanResponderRelease: () => {
        g.lastCount = 0;
      },
      onPanResponderTerminate: () => {
        g.lastCount = 0;
      },
    }),
  ).current;

  const onViewport = (e: LayoutChangeEvent) => {
    g.VW = e.nativeEvent.layout.width;
    g.VH = e.nativeEvent.layout.height;
  };
  const onContent = (e: LayoutChangeEvent) => {
    g.CW = e.nativeEvent.layout.width;
    g.CH = e.nativeEvent.layout.height;
  };

  return (
    <View style={styles.viewport} onLayout={onViewport} {...responder.panHandlers}>
      <View style={styles.center}>
        <Animated.View onLayout={onContent} style={{ transform: [{ translateX: tx }, { translateY: ty }, { scale }] }}>
          {children}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
