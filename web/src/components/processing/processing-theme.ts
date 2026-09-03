export type ProcessingTheme = {
  slug: string;
  label: string;
  subtitle: string;
  icon: string;
  headerGradient: string;
  headerGlow: string;
  pageBg: string;
  pagePattern: string;
  accent: string;
  accentMuted: string;
  border: string;
  pillActive: string;
  pillInactive: string;
  rowSelected: string;
  rowTaken: string;
  summaryBg: string;
  statCard: string;
  statIcon: string;
  dockBorder: string;
  heroBadge: string;
  scrollbar: string;
};

export const PROCESSING_THEMES: Record<string, ProcessingTheme> = {
  green: {
    slug: 'green',
    label: 'الزيتون الأخضر',
    subtitle: 'معالجة وعصر الزيتون الأخضر — جدول مرحي',
    icon: '🫒',
    headerGradient: 'from-emerald-800 via-emerald-600 to-teal-500',
    headerGlow: 'shadow-emerald-600/30',
    pageBg:
      'bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,rgba(16,185,129,0.22),transparent),radial-gradient(ellipse_60%_50%_at_100%_20%,rgba(20,184,166,0.12),transparent),linear-gradient(180deg,#f0fdf4_0%,#ecfdf5_40%,#f8faf8_100%)]',
    pagePattern: 'processing-pattern-green',
    accent: 'text-emerald-700 dark:text-emerald-300',
    accentMuted: 'bg-emerald-500',
    border: 'border-emerald-200/60 dark:border-emerald-800/50',
    pillActive: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/35 ring-2 ring-emerald-400/30',
    pillInactive:
      'bg-white/80 text-stone-700 ring-1 ring-stone-200/80 hover:bg-emerald-50 dark:bg-stone-900/80 dark:text-stone-200 dark:ring-stone-700',
    rowSelected: 'bg-emerald-50 ring-2 ring-emerald-500/50 dark:bg-emerald-950/40 shadow-sm',
    rowTaken: 'bg-emerald-50/60 dark:bg-emerald-950/15',
    summaryBg: 'bg-emerald-100/95 dark:bg-emerald-950/55',
    statCard:
      'border-emerald-200/70 bg-white/75 backdrop-blur-md dark:border-emerald-900/50 dark:bg-stone-900/70',
    statIcon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    dockBorder: 'border-emerald-300/50 dark:border-emerald-800',
    heroBadge: 'bg-emerald-500/25 text-emerald-50 border-white/20',
    scrollbar: 'rgba(16, 185, 129, 0.4)',
  },
  zbouch: {
    slug: 'zbouch',
    label: 'الزبوش',
    subtitle: 'معالجة وعصر زيتون الزبوش',
    icon: '🌿',
    headerGradient: 'from-blue-800 via-blue-600 to-indigo-500',
    headerGlow: 'shadow-blue-600/30',
    pageBg:
      'bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,rgba(37,99,235,0.2),transparent),radial-gradient(ellipse_55%_45%_at_0%_60%,rgba(99,102,241,0.1),transparent),linear-gradient(180deg,#eff6ff_0%,#f0f4ff_45%,#f8fafc_100%)]',
    pagePattern: 'processing-pattern-zbouch',
    accent: 'text-blue-700 dark:text-blue-300',
    accentMuted: 'bg-blue-500',
    border: 'border-blue-200/60 dark:border-blue-800/50',
    pillActive: 'bg-blue-600 text-white shadow-lg shadow-blue-600/35 ring-2 ring-blue-400/30',
    pillInactive:
      'bg-white/80 text-stone-700 ring-1 ring-stone-200/80 hover:bg-blue-50 dark:bg-stone-900/80 dark:text-stone-200 dark:ring-stone-700',
    rowSelected: 'bg-blue-50 ring-2 ring-blue-500/50 dark:bg-blue-950/40 shadow-sm',
    rowTaken: 'bg-blue-50/60 dark:bg-blue-950/15',
    summaryBg: 'bg-blue-100/95 dark:bg-blue-950/55',
    statCard:
      'border-blue-200/70 bg-white/75 backdrop-blur-md dark:border-blue-900/50 dark:bg-stone-900/70',
    statIcon: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    dockBorder: 'border-blue-300/50 dark:border-blue-800',
    heroBadge: 'bg-blue-500/25 text-blue-50 border-white/20',
    scrollbar: 'rgba(59, 130, 246, 0.4)',
  },
  ripe: {
    slug: 'ripe',
    label: 'الزيتون الطايب',
    subtitle: 'معالجة وعصر الزيتون الطايب — جدول مرحي',
    icon: '🍇',
    headerGradient: 'from-rose-800 via-rose-600 to-amber-500',
    headerGlow: 'shadow-rose-600/30',
    pageBg:
      'bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,rgba(225,29,72,0.18),transparent),radial-gradient(ellipse_50%_40%_at_100%_70%,rgba(245,158,11,0.1),transparent),linear-gradient(180deg,#fff1f2_0%,#fff7ed_42%,#fafaf9_100%)]',
    pagePattern: 'processing-pattern-ripe',
    accent: 'text-rose-700 dark:text-rose-300',
    accentMuted: 'bg-rose-500',
    border: 'border-rose-200/60 dark:border-rose-800/50',
    pillActive: 'bg-rose-600 text-white shadow-lg shadow-rose-600/35 ring-2 ring-rose-400/30',
    pillInactive:
      'bg-white/80 text-stone-700 ring-1 ring-stone-200/80 hover:bg-rose-50 dark:bg-stone-900/80 dark:text-stone-200 dark:ring-stone-700',
    rowSelected: 'bg-rose-50 ring-2 ring-rose-500/50 dark:bg-rose-950/40 shadow-sm',
    rowTaken: 'bg-rose-50/60 dark:bg-rose-950/15',
    summaryBg: 'bg-rose-100/95 dark:bg-rose-950/55',
    statCard:
      'border-rose-200/70 bg-white/75 backdrop-blur-md dark:border-rose-900/50 dark:bg-stone-900/70',
    statIcon: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    dockBorder: 'border-rose-300/50 dark:border-rose-800',
    heroBadge: 'bg-rose-500/25 text-rose-50 border-white/20',
    scrollbar: 'rgba(244, 63, 94, 0.4)',
  },
};
