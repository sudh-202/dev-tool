import { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  LogOut
} from 'lucide-react';
import { QuickNotes } from './QuickNotes';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AIPromptInput } from './AIPromptInput';
import { cn } from '@/lib/utils';
import { logout } from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';


interface SidebarProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  pinnedCount: number;
  onAIPrompt: () => void;
}

export function Sidebar({ categories, selectedCategory, onCategorySelect, pinnedCount, onAIPrompt }: SidebarProps) {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showTechNews, setShowTechNews] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
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
        "fixed md:relative inset-y-0 left-0 w-64 max-w-[85vw] bg-sidebar border-r border-sidebar-border z-50 transition-transform duration-300 md:translate-x-0 flex flex-col",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 sm:p-6 pt-14 md:pt-6 border-b border-sidebar-border">
          <Logo />
          <p className="text-sm text-sidebar-foreground/60 mt-1">
            Your developer tools hub
          </p>
        </div>

        <ScrollArea className="flex-1 p-3 sm:p-4">
          <div className="space-y-2">
            {pinnedCount > 0 && (
              <Button
                variant={selectedCategory === 'pinned' ? 'secondary' : 'ghost'}
                className="w-full justify-between h-9 px-2 sm:px-3 font-normal text-sm"
                onClick={() => handleCategorySelect('pinned')}
              >
                <div className="flex items-center">
                  <BookmarkCheck className="h-4 w-4 mr-1.5 sm:mr-2 text-sidebar-foreground" />
                  <span className="text-sidebar-foreground">Pinned</span>
                </div>
                <Badge variant="secondary" className="bg-sidebar-accent/50 text-sidebar-foreground text-xs">
                  {pinnedCount}
                </Badge>
              </Button>
            )}

            <Button
              variant={selectedCategory === 'all' ? 'secondary' : 'ghost'}
              className="w-full justify-between h-9 px-2 sm:px-3 font-normal text-sm"
              onClick={() => handleCategorySelect('all')}
            >
              <div className="flex items-center">
                <LayoutGrid className="h-4 w-4 mr-1.5 sm:mr-2 text-sidebar-foreground" />
                <span className="text-sidebar-foreground">All Tools</span>
              </div>
              <Badge variant="secondary" className="bg-sidebar-accent/50 text-sidebar-foreground text-xs">
                {categories.reduce((sum, cat) => sum + cat.toolCount, 0)}
              </Badge>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-9 px-2 sm:px-3 font-normal text-sm"
              onClick={() => {
                onAIPrompt();
                if (window.innerWidth < 768) {
                  setIsMobileOpen(false);
                }
              }}
            >
              <Sparkles className="h-4 w-4 mr-1.5 sm:mr-2 text-sidebar-foreground" />
              <span className="text-sidebar-foreground">AI Search</span>
            </Button>

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
              <StickyNote className="h-4 w-4 mr-1.5 sm:mr-2 text-sidebar-foreground" />
              <span className="text-sidebar-foreground">Quick Notes</span>
            </Button>

            <div className="py-2">
              <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider px-2 sm:px-3 mb-2">
                Categories
              </h3>
              <div className="space-y-1">
                {visibleCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.name ? 'secondary' : 'ghost'}
                    className="w-full justify-between h-9 px-2 sm:px-3 font-normal text-sm"
                    onClick={() => handleCategorySelect(category.name)}
                  >
                    <div className="flex items-center min-w-0">
                      {getCategoryIcon(category.name)}
                      <span className="text-sidebar-foreground truncate ml-1.5 sm:ml-2">{category.name}</span>
                    </div>
                    <Badge variant="secondary" className="bg-sidebar-accent/50 text-sidebar-foreground text-xs flex-shrink-0">
                      {category.toolCount}
                    </Badge>
                  </Button>
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

        {/* Logout button at bottom */}
        <div className="p-3 sm:p-4 border-t border-sidebar-border mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start h-9 px-2 sm:px-3 font-normal text-sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-1.5 sm:mr-2 text-sidebar-foreground" />
            <span className="text-sidebar-foreground">Logout</span>
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
              <QuickNotes />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}
