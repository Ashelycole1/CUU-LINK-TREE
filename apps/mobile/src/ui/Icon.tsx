import {
  CalendarDays,
  Camera,
  Check,
  ChevronUp,
  Clock,
  Code,
  FileText,
  Image as ImageIcon,
  Link,
  MapPin,
  Mic,
  Moon,
  Music,
  Plus,
  Presentation,
  Radio,
  Ticket,
  Trophy,
  Users,
  Video,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react-native";
import type { EventLinkKind } from "@event-tree/api-client";

/** App icons come from lucide (the same set as the web). Screens use these names, never lucide directly. */
const ICONS = {
  calendar: CalendarDays,
  camera: Camera,
  check: Check,
  up: ChevronUp,
  clock: Clock,
  code: Code,
  doc: FileText,
  image: ImageIcon,
  link: Link,
  pin: MapPin,
  mic: Mic,
  moon: Moon,
  music: Music,
  plus: Plus,
  slides: Presentation,
  live: Radio,
  ticket: Ticket,
  trophy: Trophy,
  users: Users,
  video: Video,
  wrench: Wrench,
  close: X,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20, color, strokeWidth = 2 }: { name: IconName; size?: number; color: string; strokeWidth?: number }) {
  const C = ICONS[name];
  return <C size={size} color={color} strokeWidth={strokeWidth} />;
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
