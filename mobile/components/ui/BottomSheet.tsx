import type { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { useThemeColors, useShadow, radius, spacing, textRtl, typography } from '@/lib/theme';

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function BottomSheet({ visible, title, subtitle, onClose, children, footer }: Props) {
  const c = useThemeColors();
  const shadow = useShadow();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const maxH = Math.min(height * 0.88, 720);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="إغلاق" />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              maxHeight: maxH,
              paddingBottom: Math.max(insets.bottom, 16),
            },
            shadow.card,
          ]}
        >
          <View style={[styles.handle, { backgroundColor: c.borderStrong }]} />
          <View style={styles.head}>
            <View style={styles.headText}>
              <Text style={[styles.title, textRtl, { color: c.text }]}>{title}</Text>
              {subtitle ? (
                <Text style={[styles.subtitle, textRtl, { color: c.textMuted }]}>{subtitle}</Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.close, { backgroundColor: c.bgElevated, borderColor: c.border }]}
              hitSlop={10}
            >
              <Icon name="close" size={18} color={c.text} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>
          {footer ? <View style={[styles.footer, { borderTopColor: c.border }]}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(8,16,12,0.45)' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 6,
  },
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.md,
  },
  headText: { flex: 1 },
  title: { ...typography.h1, fontSize: 20 },
  subtitle: { ...typography.caption, marginTop: 4 },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  body: { flexGrow: 0 },
  bodyContent: { paddingHorizontal: spacing.page, paddingBottom: spacing.md },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.page,
    paddingTop: spacing.md,
    gap: 10,
  },
});
