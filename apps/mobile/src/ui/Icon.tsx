import Svg, { Path } from "react-native-svg";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Code,
  Ellipsis,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Image as ImageIcon,
  Link,
  LogOut,
  MapPin,
  Mic,
  Moon,
  Music,
  Play,
  Plus,
  Presentation,
  Radio,
  Share,
  Star,
  Ticket,
  Trash2,
  Trophy,
  User,
  Users,
  Video,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react-native";
import type { EventLinkKind, SocialLinkDTO } from "@event-tree/api-client";

/** App icons come from lucide (the same set as the web). Screens use these names, never lucide directly. */
const LUCIDE = {
  down: ArrowDown,
  upArrow: ArrowUp,
  calendar: CalendarDays,
  camera: Camera,
  check: Check,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  up: ChevronUp,
  clock: Clock,
  code: Code,
  more: Ellipsis,
  external: ExternalLink,
  eye: Eye,
  eyeOff: EyeOff,
  doc: FileText,
  globe: Globe,
  image: ImageIcon,
  link: Link,
  logout: LogOut,
  pin: MapPin,
  mic: Mic,
  moon: Moon,
  music: Music,
  play: Play,
  plus: Plus,
  slides: Presentation,
  live: Radio,
  share: Share,
  star: Star,
  ticket: Ticket,
  trash: Trash2,
  trophy: Trophy,
  user: User,
  users: Users,
  video: Video,
  wrench: Wrench,
  close: X,
} satisfies Record<string, LucideIcon>;

/** lucide no longer ships brand marks; these are the web's outline paths on the same 24px grid. */
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
export function Icon({ name, size = 20, color, strokeWidth = 2, fill }: { name: IconName; size?: number; color: string; strokeWidth?: number; fill?: string }) {
  if (name in BRAND_PATHS) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {BRAND_PATHS[name as keyof typeof BRAND_PATHS].map((d) => (
          <Path key={d} d={d} />
        ))}
      </Svg>
    );
  }
  const C = LUCIDE[name as keyof typeof LUCIDE];
  return <C size={size} color={color} strokeWidth={strokeWidth} fill={fill ?? "none"} />;
}

/** One icon per event button type. */
export const LINK_ICONS: Record<EventLinkKind, IconName> = {
  register: "doc",
  tickets: "ticket",
  agenda: "calendar",
  livestream: "live",
  slides: "slides",
  photos: "camera",
  recording: "video",
  other: "link",
};

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

/** A category's tile icon, matching the web's categoryIcon(). */
export function categoryIcon(category?: string | null): IconName {
  const c = (category ?? "").toLowerCase();
  if (/music|concert|gig|band|dj|song/.test(c)) return "music";
  if (/tech|code|dev|hack|build/.test(c)) return "code";
  if (/talk|panel|conference|meetup|speak/.test(c)) return "mic";
  if (/sport|run|match|game|fitness|final/.test(c)) return "trophy";
  if (/party|night|club/.test(c)) return "moon";
  if (/workshop|class|training/.test(c)) return "wrench";
  if (/community|social|church|charity/.test(c)) return "users";
  return "calendar";
}
