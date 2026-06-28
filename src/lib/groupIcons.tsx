import {
  Folder, Bot, Sparkles, Code, Palette, Server, Cloud, Database, Zap,
  BookOpen, Rocket, Brain, MessageSquare, Image, Wrench, Globe, Terminal,
  GitBranch, PenTool, Cpu, LayoutGrid, Star, Heart, Flame, Box, Layers,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Curated set of Lucide icons offered as group avatars. Stored on a group by
 * its key (e.g. "Bot"); rendered via <GroupIcon icon="Bot" />.
 */
export const GROUP_ICONS: Record<string, LucideIcon> = {
  Folder, Bot, Sparkles, Code, Palette, Server, Cloud, Database, Zap,
  BookOpen, Rocket, Brain, MessageSquare, Image, Wrench, Globe, Terminal,
  GitBranch, PenTool, Cpu, LayoutGrid, Star, Heart, Flame, Box, Layers,
};

/** Premade emoji avatars (stored verbatim as the group's icon value). */
export const GROUP_EMOJIS = [
  '🤖', '✨', '🧠', '💬', '🎨', '⚙️', '🚀', '📚', '🔥', '🌐',
  '💡', '🛠️', '📦', '🧩', '⚡', '🔮', '🐙', '📝', '🎯', '🔬',
];

export const DEFAULT_GROUP_ICON = 'Folder';

/**
 * Render a group's avatar. `icon` is either a Lucide key from GROUP_ICONS or a
 * raw emoji. Falls back to the default folder icon when unset/unknown.
 */
export function GroupIcon({
  icon,
  className = 'h-4 w-4',
}: {
  icon?: string;
  className?: string;
}) {
  const Lucide = GROUP_ICONS[icon ?? ''] ?? (icon ? undefined : GROUP_ICONS[DEFAULT_GROUP_ICON]);
  if (Lucide) return <Lucide className={className} />;
  // Treat anything not in the registry as an emoji.
  return (
    <span className={cn('inline-flex items-center justify-center leading-none', className)}>
      {icon}
    </span>
  );
}
