import { useLocalStorage } from './useLocalStorage';
import type { Tool } from '@/types';

/**
 * A named group of bookmarked tools, e.g. "LLMs" → [ChatGPT, Grok].
 * `toolIds` is always a subset of the master `bookmarkIds` list.
 */
export interface BookmarkGroup {
  id: string;
  name: string;
  toolIds: string[];
  /** Avatar: a Lucide key (e.g. "Bot") or a raw emoji. Optional. */
  icon?: string;
}

const makeId = () =>
  `grp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

/**
 * Bookmarks are a quick-launch list of tool IDs (separate from categories/tags),
 * optionally organised into named groups. Two localStorage keys back this:
 *   - `bookmarked-tools`  → master list of all bookmarked tool IDs
 *   - `bookmark-groups`   → named groups, each holding a subset of those IDs
 * Both the sidebar and the dedicated Bookmarks page share this source of truth.
 */
export function useBookmarks() {
  const [bookmarkIds, setBookmarkIds] = useLocalStorage<string[]>(
    'bookmarked-tools',
    []
  );
  const [groups, setGroups] = useLocalStorage<BookmarkGroup[]>(
    'bookmark-groups',
    []
  );

  const isBookmarked = (id: string) => bookmarkIds.includes(id);

  const toggleBookmark = (id: string) => {
    if (bookmarkIds.includes(id)) {
      // Un-bookmarking also drops the tool from any groups it belongs to.
      setBookmarkIds((prev) => prev.filter((b) => b !== id));
      setGroups((prev) =>
        prev.map((g) => ({ ...g, toolIds: g.toolIds.filter((t) => t !== id) }))
      );
    } else {
      setBookmarkIds((prev) => [...prev, id]);
    }
  };

  // --- Group management ---------------------------------------------------

  const createGroup = (name: string, icon?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const id = makeId();
    setGroups((prev) => [...prev, { id, name: trimmed, toolIds: [], icon }]);
    return id;
  };

  const renameGroup = (groupId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, name: trimmed } : g))
    );
  };

  const setGroupIcon = (groupId: string, icon: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, icon } : g))
    );
  };

  const deleteGroup = (groupId: string) => {
    // Only removes the group — the tools stay bookmarked (become ungrouped).
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const addToGroup = (groupId: string, toolId: string) => {
    // Adding to a group implies the tool is bookmarked.
    setBookmarkIds((prev) => (prev.includes(toolId) ? prev : [...prev, toolId]));
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId && !g.toolIds.includes(toolId)
          ? { ...g, toolIds: [...g.toolIds, toolId] }
          : g
      )
    );
  };

  const removeFromGroup = (groupId: string, toolId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, toolIds: g.toolIds.filter((t) => t !== toolId) }
          : g
      )
    );
  };

  const groupsForTool = (toolId: string) =>
    groups.filter((g) => g.toolIds.includes(toolId)).map((g) => g.id);

  return {
    bookmarkIds,
    setBookmarkIds,
    isBookmarked,
    toggleBookmark,
    groups,
    createGroup,
    renameGroup,
    deleteGroup,
    setGroupIcon,
    addToGroup,
    removeFromGroup,
    groupsForTool,
  };
}

/**
 * Resolve raw bookmark IDs + groups against the loaded tools into a render-ready
 * view: groups with their Tool objects, plus the bookmarked tools that aren't in
 * any group. Shared by the sidebar (Index + AppLayout) so resolution lives once.
 */
export function resolveBookmarkView(
  tools: Tool[],
  bookmarkIds: string[],
  groups: BookmarkGroup[]
) {
  const byId = new Map(tools.map((t) => [t.id, t]));

  const resolvedGroups = groups.map((g) => ({
    id: g.id,
    name: g.name,
    icon: g.icon,
    tools: g.toolIds
      .map((id) => byId.get(id))
      .filter((t): t is Tool => Boolean(t)),
  }));

  const grouped = new Set(groups.flatMap((g) => g.toolIds));
  const ungrouped = bookmarkIds
    .map((id) => byId.get(id))
    .filter((t): t is Tool => Boolean(t))
    .filter((t) => !grouped.has(t.id));

  return { resolvedGroups, ungrouped };
}
