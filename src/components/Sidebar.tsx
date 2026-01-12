import { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Logo } from './Logo';
import { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  StickyNote, 
  Sparkles, 
  Plus, 
  X, 
  Newspaper, 
  BookmarkCheck, 
  LayoutGrid, 
  Code, 

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
  Settings
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
  pinnedCount: number;
  favoritesCount: number;
  allToolsCount: number;
  categoriesCount: number;
  onAIPrompt: () => void;
  onCreateCategory: (categoryName: string) => void;
  onDeleteCategory?: (categoryName: string) => void;
  customCategories?: string[];
}

export function Sidebar({ 
  categories, 
  selectedCategory, 
  onCategorySelect, 
  pinnedCount, 
  favoritesCount, 
  allToolsCount,
  categoriesCount,
  onAIPrompt,
  onCreateCategory,
  onDeleteCategory,
  customCategories = []
}: SidebarProps) {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showTechNews, setShowTechNews] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  
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
            {pinnedCount > 0 && (
              <Button
                variant={selectedCategory === 'pinned' ? 'secondary' : 'ghost'}
                className="w-full justify-between h-9 px-2 sm:px-3 font-normal text-sm"
                onClick={() => handleCategorySelect('pinned')}
              >
                <div className="flex items-center min-w-0">
                  <BookmarkCheck className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-sidebar-foreground" />
                  <span className="text-sidebar-foreground truncate">Pinned</span>
                </div>
                <Badge variant="secondary" className="bg-sidebar-accent/50 text-sidebar-foreground text-xs flex-shrink-0">
                  {pinnedCount}
                </Badge>
              </Button>
            )}

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

            

            <Button
              variant={selectedCategory === 'categories' ? 'secondary' : 'ghost'}
              className="w-full justify-between h-9 px-2 sm:px-3 font-normal text-sm"
              onClick={() => handleCategorySelect('categories')}
            >
              <div className="flex items-center min-w-0">
                <LayoutGrid className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-sidebar-foreground" />
                <span className="text-sidebar-foreground truncate">Categories</span>
              </div>
              <Badge variant="secondary" className="bg-sidebar-accent/50 text-sidebar-foreground text-xs flex-shrink-0">
                {categoriesCount}
              </Badge>
            </Button>

            {/* <Button
              variant="ghost"
              className="w-full justify-start h-9 px-2 sm:px-3 font-normal text-sm"
              onClick={() => {
                onAIPrompt();
                if (window.innerWidth < 768) {
                  setIsMobileOpen(false);
                }
              }}
            >
              <Sparkles className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-sidebar-foreground" />
              <span className="text-sidebar-foreground truncate">AI Search</span>
            </Button> */}

            <Button
              variant="ghost"
              className="w-full justify-start h-9 px-2 sm:px-3 font-normal text-sm"
              onClick={() => {
                setShowNotes(!showNotes);
                if (window.innerWidth < 768) {
                  setIsMobileOpen(false);
                }
              }}
            >
              <StickyNote className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-sidebar-foreground" />
              <span className="text-sidebar-foreground truncate">Quick Notes</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-9 px-2 sm:px-3 font-normal text-sm"
              onClick={() => {
                navigate('/prompts');
                if (window.innerWidth < 768) {
                  setIsMobileOpen(false);
                }
              }}
            >
              <Newspaper className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-sidebar-foreground" />
              <span className="text-sidebar-foreground truncate">Prompt / Docs</span>
            </Button>

            <div className="py-2">
              <div className="flex justify-between items-center px-2 sm:px-3 mb-2">
                <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                  Categories
                </h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                    onClick={() => setIsAddingCategory(true)}
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

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

              <div className="space-y-1">
                {visibleCategories.map((category) => (
                  <div key={category.id} className="relative group">
                    <Button
                      variant={selectedCategory === category.name ? 'secondary' : 'ghost'}
                      className="w-full justify-between h-9 px-2 sm:px-3 font-normal text-sm"
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
            </div>
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
