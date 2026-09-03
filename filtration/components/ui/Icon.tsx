import type { LucideIcon, LucideProps } from 'lucide-react-native';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Download,
  Droplets,
  FileText,
  FlaskConical,
  History,
  Leaf,
  Lock,
  LogOut,
  MapPin,
  Moon,
  Package,
  Pencil,
  Phone,
  Plus,
  PlusCircle,
  Printer,
  Scale,
  Search,
  Share2,
  ShoppingBag,
  Sun,
  User,
  UserCircle,
  Users,
  X,
} from 'lucide-react-native';

/**
 * Même famille d’icônes que le web (lucide-react).
 * SVG via lucide-react-native — fiable en APK release (pas de police d’icônes).
 */
export const ICON_MAP = {
  nutrition: Leaf,
  leaf: Leaf,
  'leaf-outline': Leaf,
  water: Droplets,
  moon: Moon,
  sunny: Sun,
  'person-outline': User,
  'person-circle-outline': UserCircle,
  'people-outline': Users,
  'lock-closed-outline': Lock,
  'call-outline': Phone,
  'document-text-outline': FileText,
  'alert-circle': AlertCircle,
  'checkmark-circle': CheckCircle2,
  'create-outline': Pencil,
  'add-circle': PlusCircle,
  add: Plus,
  search: Search,
  locate: MapPin,
  'log-out-outline': LogOut,
  'arrow-forward': ChevronLeft,
  'chevron-back': ChevronLeft,
  'scale-outline': Scale,
  'bag-outline': ShoppingBag,
  'layers-outline': Package,
  'beaker-outline': FlaskConical,
  print: Printer,
  share: Share2,
  download: Download,
  history: History,
  close: X,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICON_MAP;

type Props = {
  name: IconName | string;
  size?: number;
  color?: string;
  strokeWidth?: number;
} & Omit<LucideProps, 'size' | 'color' | 'strokeWidth'>;

export function Icon({ name, size = 20, color = '#111', strokeWidth = 2, ...rest }: Props) {
  const Lucide = ICON_MAP[name as IconName] ?? Leaf;

  return <Lucide size={size} color={color} strokeWidth={strokeWidth} {...rest} />;
}
