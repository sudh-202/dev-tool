import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tool, Category } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import { useSupabaseTools } from '@/hooks/useSupabaseTools';
import { useBookmarks, resolveBookmarkView } from '@/hooks/useBookmarks';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const defaultCategories = [
  'Frontend',
  'Backend',
  'AI Tools',
  'Design',
  'DevOps',
  'Productivity',
  'Learning',
  'Other',
];

interface AppData {
  tools: Tool[];
  loading: boolean;
}

const AppDataContext = createContext<AppData>({ tools: [], loading: false });

/** Access the tools loaded by the surrounding AppLayout (avoids a second fetch). */
export const useAppData = () => useContext(AppDataContext);

/**
 * Shared shell for secondary pages (Bookmarks, Settings, …) that renders the
 * same left sidebar as the dashboard. Category actions navigate back to the
 * dashboard via a `?cat=` query param, which Index reads on mount.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { tools, loading } = useSupabaseTools();
  const { bookmarkIds, toggleBookmark, groups } = useBookmarks();
  const [customCategories, setCustomCategories] = useLocalStorage<string[]>('custom-categories', []);
  const [deletedCategories] = useLocalStorage<string[]>('deleted-categories', []);

  const allCategoryNames = useMemo(
    () =>
      [...defaultCategories, ...customCategories].filter(
        (c) => !deletedCategories.includes(c)
      ),
    [customCategories, deletedCategories]
  );

  const categories: Category[] = useMemo(() => {
    const map = new Map<string, number>();
    allCategoryNames.forEach((c) => map.set(c, 0));
    tools.forEach((tool) => {
      const cats = tool.categories || (tool.category ? [tool.category] : []);
      cats.forEach((c) => map.set(c, (map.get(c) || 0) + 1));
    });
    return Array.from(map.entries()).map(([name, toolCount]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      icon: '📁',
      toolCount,
    }));
  }, [tools, allCategoryNames]);

  const favoritesCount = tools.filter((t) => t.isFavorite || t.isPinned).length;

  const categoriesCount = useMemo(() => {
    const set = new Set<string>();
    tools.forEach((tool) => {
      const cats = tool.categories?.length
        ? tool.categories
        : tool.category
          ? [tool.category]
          : ['Uncategorized'];
      cats.forEach((c) => set.add(c));
    });
    return set.size;
  }, [tools]);

  const { resolvedGroups, ungrouped } = useMemo(
    () => resolveBookmarkView(tools, bookmarkIds, groups),
    [tools, bookmarkIds, groups]
  );

  const goToCategory = (category: string) =>
    navigate(`/?cat=${encodeURIComponent(category)}`);

  const handleCreateCategory = (name: string) => {
    if (name && !allCategoryNames.includes(name)) {
      setCustomCategories((prev) => [...prev, name]);
    }
    goToCategory(name);
  };

  return (
    <AppDataContext.Provider value={{ tools, loading }}>
      <div className="min-h-screen bg-background flex w-full">
        <Sidebar
          categories={categories}
          selectedCategory=""
          onCategorySelect={goToCategory}
          favoritesCount={favoritesCount}
          allToolsCount={tools.length}
          categoriesCount={categoriesCount}
          onAIPrompt={() => navigate('/')}
          onCreateCategory={handleCreateCategory}
          customCategories={customCategories}
          bookmarkGroups={resolvedGroups}
          ungroupedBookmarks={ungrouped}
          onBookmarkClick={(tool) => window.open(tool.url, '_blank')}
          onRemoveBookmark={toggleBookmark}
        />
        <div className="flex-1 flex flex-col md:ml-60">{children}</div>
      </div>
    </AppDataContext.Provider>
  );
}
