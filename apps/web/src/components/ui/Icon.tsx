import type { ComponentType, SVGProps } from "react";
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  Church,
  Utensils,
  CalendarPlus,
  Camera,
  ChartLine,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  Clock,
  Code,
  Copy,
  Ellipsis,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  GripVertical,
  House,
  Library,
  Link,
  LogOut,
  MapPin,
  Mic,
  Moon,
  Music,
  Palette,
  PenLine,
  Pencil,
  Play,
  Plus,
  Presentation,
  Radio,
  Search,
  Settings,
  Share2,
  Star,
  Sun,
  Ticket,
  Trash2,
  Trophy,
  Users,
  Wrench,
  X,
} from "lucide-react";
import type { EventLinkKind, SocialLinkDTO } from "@event-tree/api-client";

type Svg = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>;

/** UI icons come from lucide-react (stroke 2). Names stay stable so pages don't import lucide directly. */
const LUCIDE = {
  edit: Pencil,
  pen: PenLine,
  trash: Trash2,
  up: ChevronUp,
  down: ChevronDown,
  left: ChevronLeft,
  right: ChevronRight,
  close: X,
  plus: Plus,
  check: Check,
  back: ArrowLeft,
  share: Share2,
  external: ExternalLink,
  copy: Copy,
  logout: LogOut,
  eye: Eye,
  eyeOff: EyeOff,
  ticket: Ticket,
  palette: Palette,
  food: Utensils,
  faith: Church,
  chart: ChartLine,
  calendar: CalendarDays,
  calendarPlus: CalendarPlus,
  archive: Archive,
  live: Radio,
  slides: Presentation,
  camera: Camera,
  play: Play,
  link: Link,
  globe: Globe,
  more: Ellipsis,
  grip: GripVertical,
  home: House,
  search: Search,
  library: Library,
  settings: Settings,
  star: Star,
  alert: CircleAlert,
  mapPin: MapPin,
  clock: Clock,
  music: Music,
  mic: Mic,
  code: Code,
  trophy: Trophy,
  moon: Moon,
  sun: Sun,
  wrench: Wrench,
  users: Users,
} satisfies Record<string, Svg>;

/**
 * Social platforms. lucide no longer ships brand marks, so these are simple
 * outline paths drawn on the same 24px grid and 2px stroke.
 */
const BRAND_PATHS = {
  instagram: [
    "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z",
    "M16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4z",
    "M17.5 6.5h.01",
  ],
  x: ["M4 4l11.7 16H20L8.3 4z", "M4 20l6.8-6.8", "M13.2 10.8 20 4"],
  linkedin: [
    "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z",
    "M2 9h4v12H2z",
    "M4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z",
  ],
  whatsapp: ["M7.9 20A9 9 0 1 0 4 16.1L2 22z", "M9.5 9.5c0 2.8 2.2 5 5 5l1-1.5-2-1-1 1a3 3 0 0 1-1.5-1.5l1-1-1-2z"],
  youtube: [
    "M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17",
    "M10 15l5-3-5-3z",
  ],
  tiktok: ["M9 12a4 4 0 1 0 4 4V3a5 5 0 0 0 5 5"],
  facebook: ["M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"],
} as const;

export type IconName = keyof typeof LUCIDE | keyof typeof BRAND_PATHS;

/** Decorative icon: the control around it carries the accessible name. */
export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  if (name in BRAND_PATHS) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        className={className}
      >
        {BRAND_PATHS[name as keyof typeof BRAND_PATHS].map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  }
  const Lucide = LUCIDE[name as keyof typeof LUCIDE];
  return <Lucide size={size} strokeWidth={2} aria-hidden="true" focusable="false" className={className} />;
}

/** The icon for each kind of event button (tickets, livestream, slides…). */
export const LINK_ICONS: Record<EventLinkKind, IconName> = {
  register: "pen",
  tickets: "ticket",
  agenda: "calendar",
  livestream: "live",
  slides: "slides",
  photos: "camera",
  recording: "play",
  other: "link",
};

/** The icon for each social platform on a host's page. */
export const SOCIAL_ICONS: Record<SocialLinkDTO["platform"], IconName> = {
  instagram: "instagram",
  x: "x",
  linkedin: "linkedin",
  whatsapp: "whatsapp",
  youtube: "youtube",
  tiktok: "tiktok",
  facebook: "facebook",
  website: "globe",
};

/** Fallback artwork icon for an event without a poster, chosen from its category. */
export function categoryIcon(category: string | null | undefined): IconName {
  const c = (category ?? "").toLowerCase();
  if (/music|concert|gig|band|dj|song/.test(c)) return "music";
  if (/tech|code|dev|hack|build/.test(c)) return "code";
  if (/talk|panel|conference|meetup|speak/.test(c)) return "mic";
  if (/sport|run|match|game|fitness|final/.test(c)) return "trophy";
  if (/party|night|club/.test(c)) return "moon";
  if (/workshop|class|training/.test(c)) return "wrench";
  if (/art|film|theat|exhibit|dance|comedy/.test(c)) return "palette";
  if (/food|dinner|lunch|brunch|cook|tasting|market/.test(c)) return "food";
  if (/faith|church|worship|prayer|gospel/.test(c)) return "faith";
  if (/community|social|charity/.test(c)) return "users";
  return "calendar";
}
