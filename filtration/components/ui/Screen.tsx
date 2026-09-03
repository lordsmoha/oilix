import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, layout } from '@/lib/theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  edges?: ('top' | 'bottom')[];
};

export function Screen({ children, style, padded = true, edges = ['top', 'bottom'] }: Props) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();

  return (
    <View
      style={[
        { flex: 1, backgroundColor: c.bg },
        edges.includes('top') && { paddingTop: insets.top },
        edges.includes('bottom') && { paddingBottom: Math.max(insets.bottom, 12) },
        padded && { paddingHorizontal: layout.screenPadding },
        style,
      ]}
    >
      {children}
    </View>
  );
}
