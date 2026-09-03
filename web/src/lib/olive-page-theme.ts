/** Thème visuel unifié par type d'olive (استقبال + معالجة). */
export type OlivePageTheme = {
  slug: string;
  label: string;
  intakeTitle: string;
  intakeSubtitle: string;
  icon: string;
  headerGradient: string;
  headerGlow: string;
  pageBg: string;
  pagePattern: string;
  accent: string;
  accentText: string;
  border: string;
  ring: string;
  badge: string;
  formSection: string;
  submitBtn: string;
  statCard: string;
  statIcon: string;
};

export const OLIVE_PAGE_THEMES: Record<string, OlivePageTheme> = {
  green: {
    slug: 'green',
    label: 'الزيتون الأخضر',
    intakeTitle: 'استقبال الزيتون الأخضر',
    intakeSubtitle: 'تسجيل الزبائن والأوزان — ترقيم مستقل',
    icon: '🫒',
    headerGradient: 'from-emerald-900 via-emerald-700 to-teal-600',
    headerGlow: 'shadow-emerald-700/30',
    pageBg:
      'bg-[radial-gradient(ellipse_100%_60%_at_100%_0%,color-mix(in_srgb,var(--app-accent)_12%,transparent),transparent),var(--app-bg)]',
    pagePattern: 'processing-pattern-green',
    accent: 'text-emerald-700 dark:text-emerald-300',
    accentText: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200/60 dark:border-emerald-800/50',
    ring: 'focus:ring-emerald-500/30',
    badge: 'border-emerald-400/30 bg-emerald-500/20 text-emerald-50',
    formSection:
      'border-emerald-100/80 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/20',
    submitBtn: 'from-emerald-700 to-teal-600 shadow-emerald-900/20',
    statCard:
      'border-emerald-200/70 bg-white/80 backdrop-blur-md dark:border-emerald-900/50 dark:bg-stone-900/70',
    statIcon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  zbouch: {
    slug: 'zbouch',
    label: 'الزبوش',
    intakeTitle: 'استقبال الزبوش',
    intakeSubtitle: 'تسجيل الزبائن والأوزان — ترقيم مستقل',
    icon: '🌿',
    headerGradient: 'from-blue-900 via-blue-700 to-indigo-600',
    headerGlow: 'shadow-blue-700/30',
    pageBg:
      'bg-[radial-gradient(ellipse_100%_60%_at_100%_0%,color-mix(in_srgb,#2563eb_10%,transparent),transparent),var(--app-bg)]',
    pagePattern: 'processing-pattern-zbouch',
    accent: 'text-blue-700 dark:text-blue-300',
    accentText: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200/60 dark:border-blue-800/50',
    ring: 'focus:ring-blue-500/30',
    badge: 'border-blue-400/30 bg-blue-500/20 text-blue-50',
    formSection: 'border-blue-100/80 bg-blue-50/30 dark:border-blue-900/40 dark:bg-blue-950/20',
    submitBtn: 'from-blue-700 to-indigo-600 shadow-blue-900/20',
    statCard:
      'border-blue-200/70 bg-white/80 backdrop-blur-md dark:border-blue-900/50 dark:bg-stone-900/70',
    statIcon: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  ripe: {
    slug: 'ripe',
    label: 'الزيتون الطايب',
    intakeTitle: 'استقبال الزيتون الطايب',
    intakeSubtitle: 'تسجيل الزبائن والأوزان — ترقيم مستقل',
    icon: '🍇',
    headerGradient: 'from-rose-900 via-rose-700 to-orange-600',
    headerGlow: 'shadow-rose-700/30',
    pageBg:
      'bg-[radial-gradient(ellipse_100%_60%_at_100%_0%,color-mix(in_srgb,#e11d48_10%,transparent),transparent),var(--app-bg)]',
    pagePattern: 'processing-pattern-ripe',
    accent: 'text-rose-700 dark:text-rose-300',
    accentText: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200/60 dark:border-rose-800/50',
    ring: 'focus:ring-rose-500/30',
    badge: 'border-rose-400/30 bg-rose-500/20 text-rose-50',
    formSection: 'border-rose-100/80 bg-rose-50/30 dark:border-rose-900/40 dark:bg-rose-950/20',
    submitBtn: 'from-rose-700 to-orange-600 shadow-rose-900/20',
    statCard:
      'border-rose-200/70 bg-white/80 backdrop-blur-md dark:border-rose-900/50 dark:bg-stone-900/70',
    statIcon: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  },
};
