import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useThemeColors, useShadow, radius, textRtl, typography, font } from '@/lib/theme';

type Props = TextInputProps & {
  label: string;
  icon?: IconName;
  hint?: string;
  error?: string;
};

export function Input({ label, icon, hint, error, style, ...rest }: Props) {
  const c = useThemeColors();
  const shadow = useShadow();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, textRtl, { color: c.textMuted }]}>{label}</Text>
      <View
        style={[
          styles.field,
          {
            backgroundColor: c.inputBg,
            borderColor: error ? c.danger : c.border,
          },
          shadow.soft,
        ]}
      >
        {icon ? <Icon name={icon} size={20} color={c.textDim} style={styles.icon} /> : null}
        <TextInput
          placeholderTextColor={c.textDim}
          style={[styles.input, textRtl, { color: c.text }, style]}
          {...rest}
        />
      </View>
      {error ? (
        <Text style={[styles.error, textRtl, { color: c.danger }]}>{error}</Text>
      ) : null}
      {hint && !error ? (
        <Text style={[styles.hint, textRtl, { color: c.textDim }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { ...typography.caption, marginBottom: 8, fontFamily: font.bold },
  field: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  icon: { marginLeft: 12 },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: font.semiBold,
    paddingVertical: 14,
  },
  hint: { ...typography.micro, marginTop: 6 },
  error: { ...typography.caption, marginTop: 6 },
});
