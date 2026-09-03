import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { ActionRow } from '@/components/ui/ActionRow';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import {
  documentToHtml,
  downloadPdf,
  fetchClientCard,
  fetchClientReceipt,
  printViaSystem,
  rememberPrintWithMeta,
  sharePdf,
} from '@/lib/print/service';
import type { PrintDocument } from '@/lib/print/types';
import { useThemeColors, radius, spacing, textRtl, typography, font } from '@/lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  clientId: string;
  oliveType: string;
  initialDocument?: PrintDocument | null;
  defaultKind?: 'card' | 'receipt';
};

export function PrintSheet({
  visible,
  onClose,
  clientId,
  oliveType,
  initialDocument,
  defaultKind = 'card',
}: Props) {
  const c = useThemeColors();
  const { height } = useWindowDimensions();
  const [kind, setKind] = useState<'card' | 'receipt'>(defaultKind);
  const [doc, setDoc] = useState<PrintDocument | null>(initialDocument ?? null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (initialDocument) {
      setDoc(initialDocument);
      setKind(initialDocument.kind);
      return;
    }
    void load(defaultKind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, clientId, oliveType, initialDocument, defaultKind]);

  async function load(nextKind: 'card' | 'receipt') {
    setKind(nextKind);
    setLoading(true);
    setError('');
    try {
      const data =
        nextKind === 'card'
          ? await fetchClientCard(clientId, oliveType)
          : await fetchClientReceipt(clientId, oliveType);
      setDoc(data);
    } catch (e) {
      setDoc(null);
      setError(e instanceof Error ? e.message : 'تعذر تحميل المستند');
    } finally {
      setLoading(false);
    }
  }

  const html = useMemo(() => (doc ? documentToHtml(doc) : ''), [doc]);
  const previewH = Math.min(280, height * 0.32);

  async function run(action: 'print' | 'share' | 'pdf') {
    if (!doc) return;
    setBusy(action);
    try {
      if (action === 'print') {
        await printViaSystem(doc);
        await rememberPrintWithMeta(doc, { clientId, oliveType });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('تمت الطباعة', 'اختر الطابعة من قائمة النظام (Bluetooth / Wi‑Fi)');
      } else if (action === 'share') {
        await sharePdf(doc);
        await rememberPrintWithMeta(doc, { clientId, oliveType });
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        const uri = await downloadPdf(doc);
        await rememberPrintWithMeta(doc, { clientId, oliveType });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('تم إنشاء PDF', 'يمكنك فتح الملف أو مشاركته من مدير الملفات.\n' + uri);
      }
    } catch (e) {
      Alert.alert('خطأ', e instanceof Error ? e.message : 'فشلت العملية');
    } finally {
      setBusy(null);
    }
  }

  const subtitle =
    doc?.kind === 'card'
      ? `بطاقة #${doc.client.clientNumber}`
      : doc?.kind === 'receipt'
        ? `وصل #${doc.client.clientNumber}`
        : 'معاينة قبل الطباعة';

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="الطباعة"
      subtitle={subtitle}
      footer={<Button label="إغلاق" variant="secondary" onPress={onClose} />}
    >
      {!initialDocument ? (
        <View style={styles.tabs}>
          <Pressable
            onPress={() => void load('card')}
            style={[
              styles.tab,
              {
                backgroundColor: kind === 'card' ? c.primary : c.bgElevated,
                borderColor: kind === 'card' ? c.primary : c.border,
              },
            ]}
          >
            <Text style={[styles.tabText, { color: kind === 'card' ? '#fff' : c.text }]}>
              بطاقة تعريف
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void load('receipt')}
            style={[
              styles.tab,
              {
                backgroundColor: kind === 'receipt' ? c.primary : c.bgElevated,
                borderColor: kind === 'receipt' ? c.primary : c.border,
              },
            ]}
          >
            <Text style={[styles.tabText, { color: kind === 'receipt' ? '#fff' : c.text }]}>
              وصل الزبون
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View
        style={[
          styles.preview,
          { height: previewH, backgroundColor: c.bgElevated, borderColor: c.border },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={c.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={[styles.error, textRtl, { color: c.danger }]}>{error}</Text>
        ) : html ? (
          <WebView
            originWhitelist={['*']}
            source={{ html }}
            style={styles.webview}
            scrollEnabled
            showsVerticalScrollIndicator={false}
          />
        ) : null}
      </View>

      {doc ? (
        <View>
          <Text style={[styles.section, textRtl, { color: c.textMuted }]}>إجراءات</Text>
          <ActionRow
            icon="print"
            title="طباعة"
            subtitle="Bluetooth · Wi‑Fi · طابعة النظام"
            onPress={() => void run('print')}
            loading={busy === 'print'}
            disabled={!!busy}
          />
          <ActionRow
            icon="share"
            title="مشاركة PDF"
            subtitle="واتساب، بريد، ملفات…"
            onPress={() => void run('share')}
            loading={busy === 'share'}
            disabled={!!busy}
            accent={c.gold}
          />
          <ActionRow
            icon="download"
            title="حفظ PDF"
            subtitle="إنشاء ملف للتحميل"
            onPress={() => void run('pdf')}
            loading={busy === 'pdf'}
            disabled={!!busy}
          />

          <View style={[styles.metaBox, { backgroundColor: c.primarySoft, borderColor: c.border }]}>
            <Text style={[styles.metaTitle, textRtl, { color: c.primary }]}>محتوى المستند</Text>
            {doc.kind === 'card' ? (
              <>
                <MetaLine label="الزبون" value={`${doc.client.lastName} ${doc.client.firstName}`} />
                <MetaLine label="الرقم" value={String(doc.client.clientNumber)} />
                <MetaLine label="الوزن" value={`${doc.weightKg} كغ`} />
                <MetaLine label="أكياس / ضلف" value={`${doc.bags} / ${doc.adhlef}`} />
              </>
            ) : (
              <>
                <MetaLine label="الزبون" value={`${doc.client.lastName} ${doc.client.firstName}`} />
                <MetaLine label="الوزن" value={`${doc.weighing.totalWeightKg} كغ`} />
                <MetaLine label="المبلغ" value={`${doc.financial.totalAmount.toFixed(2)} دج`} />
                <MetaLine label="المستخدم" value={doc.printedBy || '—'} />
              </>
            )}
          </View>
        </View>
      ) : null}
    </BottomSheet>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View style={styles.metaLine}>
      <Text style={[styles.metaLabel, { color: c.textDim }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row-reverse', gap: 8, marginBottom: spacing.md },
  tab: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  tabText: { fontFamily: font.bold, fontSize: 14 },
  preview: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  webview: { flex: 1, backgroundColor: '#fff' },
  error: { ...typography.body, padding: 20, textAlign: 'center' },
  section: { ...typography.caption, fontFamily: font.bold, marginBottom: 8 },
  metaBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 14,
    marginTop: 6,
    marginBottom: 8,
    gap: 8,
  },
  metaTitle: { ...typography.caption, fontFamily: font.bold, marginBottom: 4 },
  metaLine: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 8 },
  metaLabel: { ...typography.caption },
  metaValue: { ...typography.caption, fontFamily: font.bold, flexShrink: 1, textAlign: 'left' },
});
