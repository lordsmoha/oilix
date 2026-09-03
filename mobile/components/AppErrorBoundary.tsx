import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

/**
 * Empêche un crash React de laisser un écran blanc.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'خطأ غير متوقع',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>حدث خطأ في التطبيق</Text>
        <Text style={styles.msg}>{this.state.message}</Text>
        <Pressable
          style={styles.btn}
          onPress={() => this.setState({ hasError: false, message: '' })}
        >
          <Text style={styles.btnText}>إعادة المحاولة</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#F7F4EF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2E24',
    textAlign: 'center',
  },
  msg: {
    fontSize: 14,
    color: '#5C6B63',
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    marginTop: 8,
    backgroundColor: '#1B5E3B',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
