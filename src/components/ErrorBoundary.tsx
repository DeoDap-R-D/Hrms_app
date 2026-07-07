import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
  /** Bumped on retry to force-remount the subtree (resets navigation to start). */
  resetKey: number;
}

/**
 * Catches render/lifecycle errors anywhere in the tree and shows a recovery
 * screen instead of letting the app hard-crash to the launcher. "Try Again"
 * force-remounts the app (back to the initial route) so the user can continue.
 *
 * Self-contained styling (no theme dependency) so it renders even if a provider
 * is the thing that failed.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, resetKey: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Surfaced in logcat (ReactNativeJS) for diagnosis; app stays alive.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }

  handleRetry = () => {
    this.setState(s => ({ hasError: false, resetKey: s.resetKey + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.root}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>!</Text>
          </View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The app hit an unexpected error. Tap below to reload — you won't be signed out.
          </Text>
          <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4EEDF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#FFE2D6', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  icon: { fontSize: 40, fontWeight: '900', color: '#FF6E40', lineHeight: 44 },
  title: { fontSize: 21, fontWeight: '800', color: '#1E3D59', letterSpacing: -0.3, marginBottom: 10 },
  message: { fontSize: 14.5, color: '#5E6E7B', textAlign: 'center', lineHeight: 21, marginBottom: 30 },
  button: { backgroundColor: '#1E3D59', paddingHorizontal: 36, paddingVertical: 15, borderRadius: 14 },
  buttonText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '700' },
});
