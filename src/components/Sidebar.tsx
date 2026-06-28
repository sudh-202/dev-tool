import { Category, Tool } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Logo } from './Logo';
import { GroupIcon } from '@/lib/groupIcons';
import { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  ChevronDown, 
  ChevronUp,
  StickyNote,
  Plus,
  X, 
  Newspaper,
  LayoutGrid,
  Code, 
  Image,
  PenTool,
  ArrowRightLeft,
  ListTodo,

  Server, 
  Palette, 
  Wrench, 
  Rocket, 
  Zap, 
  GraduationCap, 
  Folder,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Heart,
  Check,
  FolderPlus,
  Settings,
  Bookmark,
  ExternalLink,
  LayoutDashboard
} from 'lucide-react';
import { QuickNotes } from './QuickNotes';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AIPromptInput } from './AIPromptInput';
import { cn } from '@/lib/utils';
import { logout } from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { AIModelSelector } from './AIModelSelector';


interface SidebarProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  favoritesCount: number;
  allToolsCount: number;
  categoriesCount: number;
  onAIPrompt: () => void;
  onCreateCategory: (categoryName: string) => void;
  onDeleteCategory?: (categoryName: string) => void;
  customCategories?: string[];
  bookmarkGroups?: { id: string; name: string; icon?: string; tools: Tool[] }[];
  ungroupedBookmarks?: Tool[];
  onBookmarkClick?: (tool: Tool) => void;
  onRemoveBookmark?: (id: string) => void;
}

export function Sidebar({ 
  categories, 
  selectedCategory,
  onCategorySelect,
  favoritesCount,
  allToolsCount,
  categoriesCount,
  onAIPrompt,
  onCreateCategory,
  onDeleteCategory,
  customCategories = [],
  bookmarkGroups = [],
  ungroupedBookmarks = [],
  onBookmarkClick,
  onRemoveBookmark
}: SidebarProps) {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showTechNews, setShowTechNews] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useLocalStorage('sidebar-more-open', false);
  const [bookmarksOpen, setBookmarksOpen] = useLocalStorage('sidebar-bookmarks-open', true);
  const [categoriesOpen, setCategoriesOpen] = useLocalStorage('sidebar-categories-open', false);
  const [collapsedGroups, setCollapsedGroups] = useLocalStorage<Record<string, boolean>>('sidebar-bookmark-groups-collapsed', {});
  const navigate = useNavigate();

  const toggleGroup = (id: string) =>
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  // Total unique bookmarked tools (group members + ungrouped) for the badge.
  const totalBookmarks = useMemo(() => {
    const ids = new Set<string>();
    bookmarkGroups.forEach((g) => g.tools.forEach((t) => ids.add(t.id)));
    ungroupedBookmarks.forEach((t) => ids.add(t.id));
    return ids.size;
  }, [bookmarkGroups, ungroupedBookmarks]);

  const getFaviconUrl = (url: string) => {
    try {
      return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`;
    } catch {
      return null;
    }
  };

  const closeOnMobile = () => {
    if (window.innerWidth < 768) setIsMobileOpen(false);
  };

  // A single bookmarked tool row, reused inside groups and the ungrouped list.
  const renderBookmark = (tool: Tool) => {
    const favicon = getFaviconUrl(tool.url);
    return (
      <div key={tool.id}>
        <Button
          variant="ghost"
          className="w-full justify-start h-8 pl-2 pr-2 font-normal text-sm"
          onClick={() => {
            onBookmarkClick?.(tool);
            closeOnMobile();
          }}
        >
          {favicon ? (
            <img src={favicon} alt="" className="h-4 w-4 mr-2 rounded-sm flex-shrink-0" />
          ) : (
            <ExternalLink className="h-3.5 w-3.5 mr-2 flex-shrink-0 text-sidebar-foreground/60" />
          )}
          <span className="text-sidebar-foreground truncate">{tool.name}</span>
        </Button>
      </div>
    );
  };
  
  // Sort categories by toolCount (highest first)
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => b.toolCount - a.toolCount);
  }, [categories]);
  
  // Determine which categories to show
  const initialCategories = sortedCategories.slice(0, 4);
  const hiddenCategories = sortedCategories.slice(4);
  const visibleCategories = showAllCategories ? sortedCategories : initialCategories;

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'frontend':
        return <Code className="h-4 w-4" />;
      case 'backend':
        return <Server className="h-4 w-4" />;
      case 'design':
        return <Palette className="h-4 w-4" />;
      case 'devops':
        return <Wrench className="h-4 w-4" />;
      case 'productivity':
        return <Zap className="h-4 w-4" />;
      case 'learning':
        return <GraduationCap className="h-4 w-4" />;
      case 'ai tools':
        return <Rocket className="h-4 w-4" />;
      default:
        return <Folder className="h-4 w-4" />;
    }
  };

  // Toggle mobile sidebar and also close it when a category is selected on mobile
  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleCategorySelect = (category: string) => {
    onCategorySelect(category);
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout failed',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onCreateCategory(newCategoryName.trim());
      setNewCategoryName('');
      setIsAddingCategory(false);
      toast({
        title: 'Category created',
        description: `"${newCategoryName.trim()}" has been added to your categories.`,
      });
    }
  };

  return (
    <>
      {/* Sidebar toggle button - positioned to be always visible */}
      <button 
        onClick={toggleMobileSidebar}
        className="md:hidden fixed right-4 top-4 z-[60] bg-primary text-primary-foreground rounded-md p-2 shadow-md"
        aria-label="Toggle sidebar"
      >
        {isMobileOpen ? (
          <ChevronLeft className="h-5 w-5" />
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
      </button>

      {/* Sidebar overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Main sidebar */}
      <div className={cn(
        "fixed md:fixed inset-y-0 left-0 w-60 max-w-[80vw] bg-sidebar border-r border-sidebar-border z-50 transition-transform duration-300 md:translate-x-0 flex flex-col h-screen",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header section - always visible */}
        <div className="p-4 sm:p-6 pt-14 md:pt-6 border-b border-sidebar-border shrink-0">
          <Logo />
          <p className="text-sm text-sidebar-foreground/60 mt-1">
            Your developer tools hub
          </p>
        </div>

        {/* Scrollable content area */}
        <ScrollArea className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-3 sm:p-4 space-y-2">
          <Button
              variant={selectedCategory === 'all' ? 'secondary' : 'ghost'}
              className="w-full justify-between h-9 px-2 sm:px-3 font-normal text-sm"
              onClick={() => handleCategorySelect('all')}
            >
              <div className="flex items-center min-w-0">
                <Folder className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-sidebar-foreground" />
                <span className="text-sidebar-foreground truncate">All Tools</span>
              </div>
              <Badge variant="secondary" className="bg-sidebar-accent/50 text-sidebar-foreground text-xs flex-shrink-0">
                {allToolsCount}
              </Badge>
            </Button>
            <Button
              variant={selectedCategory === 'favorites' ? 'secondary' : 'ghost'}
              className="w-full justify-between h-9 px-2 sm:px-3 font-normal text-sm"
              onClick={() => handleCategorySelect('favorites')}
            >
              <div className="flex items-center min-w-0 overflow-hidden">
                <Heart className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-sidebar-foreground" />
                <span className="text-sidebar-foreground truncate">Favorites</span>
              </div>
              <Badge variant="secondary" className="bg-sidebar-accent/50 text-sidebar-foreground text-xs flex-shrink-0">
                {favoritesCount}
              </Badge>
            </Button>

            {/* Bookmarks bar — a simple, flat quick-launch list of starred tools */}
            <Collapsible open={bookmarksOpen} onOpenChange={setBookmarksOpen} className="pt-1">
              <div className="flex items-center">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex-1 justify-between h-9 px-2 sm:px-3 font-normal text-sm"
                  >
                    <div className="flex items-center min-w-0">
                      <Bookmark className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-sidebar-foreground" />
                      <span className="text-sidebar-foreground truncate">Bookmarks</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {totalBookmarks > 0 && (
                        <Badge variant="secondary" className="bg-sidebar-accent/50 text-sidebar-foreground text-xs flex-shrink-0">
                          {totalBookmarks}
                        </Badge>
                      )}
                      <ChevronDown className={cn("h-4 w-4 text-sidebar-foreground/60 transition-transform", bookmarksOpen && "rotate-180")} />
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Manage bookmarks"
                  className="h-7 w-7 p-0 ml-1 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                  onClick={() => { navigate('/bookmarks'); closeOnMobile(); }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <CollapsibleContent className="pt-0.5">
                {/* Left guide line makes nesting clear */}
                <div className="ml-3 pl-3 border-l border-sidebar-border/50 space-y-0.5">
                  {totalBookmarks === 0 ? (
                    <button
                      onClick={() => { navigate('/bookmarks'); closeOnMobile(); }}
                      className="w-full text-left px-2 py-1.5 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground leading-relaxed"
                    >
                      No bookmarks yet — click + to add tools and organise them into groups.
                    </button>
                  ) : (
                    <>
                      {/* Grouped bookmarks */}
                      {bookmarkGroups
                        .filter((g) => g.tools.length > 0)
                        .map((g) => {
                          const collapsed = collapsedGroups[g.id];
                          return (
                            <div key={g.id}>
                              <Button
                                variant="ghost"
                                className="w-full justify-between h-8 px-2 font-normal text-sm"
                                onClick={() => toggleGroup(g.id)}
                              >
                                <div className="flex items-center min-w-0">
                                  <span className="mr-1.5 flex-shrink-0 text-sidebar-foreground/80">
                                    <GroupIcon icon={g.icon} className="h-3.5 w-3.5" />
                                  </span>
                                  <span className="text-sidebar-foreground truncate text-xs">{g.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Badge variant="secondary" className="bg-sidebar-accent/50 text-sidebar-foreground text-xs flex-shrink-0">
                                    {g.tools.length}
                                  </Badge>
                                  <ChevronDown className={cn("h-3 w-3 text-sidebar-foreground/60 transition-transform", !collapsed && "rotate-180")} />
                                </div>
                              </Button>
                              {!collapsed && (
                                /* Second-level indent for tools inside a group */
                                <div className="ml-2 pl-2 border-l border-sidebar-border/30 space-y-0.5">
                                  {g.tools.map((tool) => renderBookmark(tool))}
                                </div>
                              )}
                            </div>
                          );
                        })}

                      {/* Ungrouped bookmarks listed flat */}
                      {ungroupedBookmarks.map((tool) => renderBookmark(tool))}
                    </>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Categories — collapsed by default to reduce sidebar clutter */}
            <Collapsible open={categoriesOpen} onOpenChange={setCategoriesOpen}>
              <div className="flex items-center">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex-1 justify-between h-9 px-2 sm:px-3 font-normal text-sm"
                  >
                    <div className="flex items-center min-w-0">
                      <LayoutGrid className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-sidebar-foreground" />
                      <span className="text-sidebar-foreground truncate">Categories</span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 text-sidebar-foreground/60 transition-transform", categoriesOpen && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 p-0 ml-1 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                  onClick={() => { setCategoriesOpen(true); setIsAddingCategory(true); }}
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <CollapsibleContent className="pt-0.5">
                {isAddingCategory && (
                  <div className="mb-2 px-2 sm:px-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name"
                        className="h-7 text-xs bg-sidebar-accent/30"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddCategory();
                          if (e.key === 'Escape') {
                            setIsAddingCategory(false);
                            setNewCategoryName('');
                          }
                        }}
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] flex-1 bg-sidebar-accent/20"
                        onClick={handleAddCategory}
                      >
                        <Check className="h-3 w-3 mr-1" /> Add
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] flex-1"
                        onClick={() => {
                          setIsAddingCategory(false);
                          setNewCategoryName('');
                        }}
                      >
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-1 pl-2">
                  {visibleCategories.map((category) => (
                    <div key={category.id} className="relative group">
                      <Button
                        variant={selectedCategory === category.name ? 'secondary' : 'ghost'}
                        className="w-full justify-between h-8 px-2 sm:px-3 font-normal text-sm"
                        onClick={() => handleCategorySelect(category.name)}
                      >
                        <div className="flex items-center min-w-0 overflow-hidden">
                          {getCategoryIcon(category.name)}
                          <span className="text-sidebar-foreground truncate ml-1.5 sm:ml-2">{category.name}</span>
                        </div>
                        <div className="flex items-center">
                          <Badge
                            variant="secondary"
                            className="bg-sidebar-accent/50 text-sidebar-foreground text-xs flex-shrink-0 group-hover:hidden"
                          >
                            {category.toolCount}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-transparent"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoryToDelete(category.name);
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </Button>
                    </div>
                  ))}

                  {hiddenCategories.length > 0 && (
                    <Button
                      variant="ghost"
                      className="w-full justify-center h-8 px-2 sm:px-3 font-normal text-xs sm:text-sm"
                      onClick={() => setShowAllCategories(!showAllCategories)}
                    >
                      {showAllCategories ? (
                        <div className="flex items-center text-sidebar-foreground/70">
                          <span>Show Less</span>
                          <ChevronUp className="ml-1 h-3.5 sm:h-4 w-3.5 sm:w-4" />
                        </div>
                      ) : (
                        <div className="flex items-center text-sidebar-foreground/70">
                          <span>Show More ({hiddenCategories.length})</span>
                          <ChevronDown className="ml-1 h-3.5 sm:h-4 w-3.5 sm:w-4" />
                        </div>
                      )}
                    </Button>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* More — workbench tools tucked away to keep the sidebar clean */}
            <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-9 px-2 sm:px-3 font-normal text-sm"
                >
                  <div className="flex items-center min-w-0">
                    <LayoutDashboard className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-sidebar-foreground" />
                    <span className="text-sidebar-foreground truncate">More</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-sidebar-foreground/60 transition-transform", moreOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 pt-0.5 pl-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-8 px-2 sm:px-3 font-normal text-sm"
                  onClick={() => { setShowNotes(!showNotes); closeOnMobile(); }}
                >
                  <StickyNote className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-sidebar-foreground" />
                  <span className="text-sidebar-foreground truncate">Quick Notes</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-8 px-2 sm:px-3 font-normal text-sm"
                  onClick={() => { navigate('/prompts'); closeOnMobile(); }}
                >
                  <Newspaper className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-sidebar-foreground" />
                  <span className="text-sidebar-foreground truncate">Prompt / Docs</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-8 px-2 sm:px-3 font-normal text-sm"
                  onClick={() => { navigate('/workbench?tab=images'); closeOnMobile(); }}
                >
                  <Image className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-sidebar-foreground" />
                  <span className="text-sidebar-foreground truncate">Images</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-8 px-2 sm:px-3 font-normal text-sm"
                  onClick={() => { navigate('/workbench?tab=handwriting'); closeOnMobile(); }}
                >
                  <PenTool className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-sidebar-foreground" />
                  <span className="text-sidebar-foreground truncate">Handwriting</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-8 px-2 sm:px-3 font-normal text-sm"
                  onClick={() => { navigate('/workbench?tab=convert'); closeOnMobile(); }}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-sidebar-foreground" />
                  <span className="text-sidebar-foreground truncate">Convert</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-8 px-2 sm:px-3 font-normal text-sm"
                  onClick={() => { navigate('/workbench?tab=code'); closeOnMobile(); }}
                >
                  <Code className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-sidebar-foreground" />
                  <span className="text-sidebar-foreground truncate">Code Vault</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-8 px-2 sm:px-3 font-normal text-sm"
                  onClick={() => { navigate('/workbench?tab=tasks'); closeOnMobile(); }}
                >
                  <ListTodo className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-sidebar-foreground" />
                  <span className="text-sidebar-foreground truncate">Tasks</span>
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>

        {/* AI Provider section - fixed at bottom */}
        <div className="p-3 sm:p-4 border-t border-sidebar-border shrink-0">
          <div className="mb-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider px-1">
            AI Provider
          </div>
          <AIModelSelector variant="sidebar" />
        </div>

        {/* Settings and Logout buttons - fixed at bottom */}
        <div className="p-3 sm:p-4 border-t border-sidebar-border mt-auto shrink-0 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start h-9 px-2 sm:px-3 font-normal text-sm"
            onClick={() => {
              navigate('/settings');
              if (window.innerWidth < 768) {
                setIsMobileOpen(false);
              }
            }}
          >
            <Settings className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-sidebar-foreground" />
            <span className="text-sidebar-foreground truncate">Settings</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start h-9 px-2 sm:px-3 font-normal text-sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-sidebar-foreground" />
            <span className="text-sidebar-foreground truncate">Logout</span>
          </Button>
        </div>

        {showNotes && (
          <Dialog open={showNotes} onOpenChange={setShowNotes}>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
              <DialogTitle className="flex items-center">
                <div className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5" />
                  Quick Notes
                </div>
              </DialogTitle>
              <DialogDescription>
                Create and manage your quick notes
              </DialogDescription>
              <QuickNotes onOpenPromptDocs={() => {
                setShowNotes(false);
                navigate('/prompts');
                if (window.innerWidth < 768) {
                  setIsMobileOpen(false);
                }
              }} />
            </DialogContent>
          </Dialog>
        )}

        {/* Category delete confirmation dialog */}
        {categoryToDelete && onDeleteCategory && (
          <Dialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogTitle>Delete Category</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the category "{categoryToDelete}"? 
                All tools in this category will be moved to "Other".
              </DialogDescription>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setCategoryToDelete(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (categoryToDelete && onDeleteCategory) {
                      onDeleteCategory(categoryToDelete);
                      setCategoryToDelete(null);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}
