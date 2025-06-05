import { useState, useEffect, useMemo } from 'react';
import { Tool, Category } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSupabaseTools } from '@/hooks/useSupabaseTools';
import { Sidebar } from '@/components/Sidebar';
import { SearchBar } from '@/components/SearchBar';
import { ToolCard } from '@/components/ToolCard';
import { ToolListItem } from '@/components/ToolListItem';
import { AddToolModal } from '@/components/AddToolModal';
import { AIPromptInput } from '@/components/AIPromptInput';
import { ThemeToggle } from '@/components/ThemeToggle';
// import { Logo } from '@/components/Logo';
import { QuickNotes } from '@/components/QuickNotes';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Star, Clock, TrendingUp, Grid, List, Loader2, X } from 'lucide-react';

const defaultCategories = [
  'Frontend',
  'Backend',
  'AI Tools',
  'Design',
  'DevOps',
  'Productivity',
  'Learning',
  'Other'
];

const sampleTools: Tool[] = [
  {
    id: '1',
    name: 'React',
    url: 'https://reactjs.org',
    description: 'A JavaScript library for building user interfaces',
    tags: ['frontend', 'javascript', 'ui'],
    category: 'Frontend',
    isPinned: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Vercel',
    url: 'https://vercel.com',
    description: 'Deploy web projects with zero configuration',
    tags: ['deployment', 'hosting', 'frontend'],
    category: 'DevOps',
    isPinned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Figma',
    url: 'https://figma.com',
    description: 'Collaborative interface design tool',
    tags: ['design', 'ui', 'collaboration'],
    category: 'Design',
    isPinned: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const Index = () => {
  const { 
    tools, 
    loading, 
    error,
    addTool,
    addMultipleTools,
    updateTool,
    togglePin,
    removeTool,
    trackToolUsage
  } = useSupabaseTools();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAIPromptOpen, setIsAIPromptOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'usage'>('recent');
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>('view-mode', 'grid');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const categories: Category[] = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    defaultCategories.forEach(cat => categoryMap.set(cat, 0));
    
    tools.forEach(tool => {
      const count = categoryMap.get(tool.category) || 0;
      categoryMap.set(tool.category, count + 1);
    });

    return Array.from(categoryMap.entries()).map(([name, toolCount]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      icon: '📁',
      toolCount,
    }));
  }, [tools]);

  // Get all unique tags across tools
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    tools.forEach(tool => {
      tool.tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [tools]);

  const [showAllTags, setShowAllTags] = useState(false);
  
  // Determine which tags to display initially
  const visibleTags = useMemo(() => {
    return showAllTags ? availableTags : availableTags.slice(0, 10);
  }, [availableTags, showAllTags]);

  const filteredTools = useMemo(() => {
    let filtered = tools;

    // Filter by category
    if (selectedCategory === 'pinned') {
      filtered = filtered.filter(tool => tool.isPinned);
    } else if (selectedCategory === 'recently-used') {
      filtered = filtered.filter(tool => tool.lastUsed);
    } else if (selectedCategory !== 'all') {
      filtered = filtered.filter(tool => tool.category === selectedCategory);
    }

    // Filter by tags if any are selected
    if (selectedTags.length > 0) {
      filtered = filtered.filter(tool => 
        selectedTags.some(tag => tool.tags.includes(tag))
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tool => 
        tool.name.toLowerCase().includes(query) ||
        tool.description?.toLowerCase().includes(query) ||
        tool.tags.some(tag => tag.toLowerCase().includes(query)) ||
        tool.url.toLowerCase().includes(query) ||
        tool.notes?.toLowerCase().includes(query)
      );
    }

    // Sort tools
    return filtered.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      } else if (sortBy === 'usage') {
        return (b.usageCount || 0) - (a.usageCount || 0);
      } else {
        // Default: pinned first, then by creation date
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [tools, selectedCategory, searchQuery, sortBy, selectedTags]);

  // Group tools by category for "all" and "pinned" views
  const groupedTools = useMemo(() => {
    if (selectedCategory !== 'all' && selectedCategory !== 'pinned') {
      return { [selectedCategory]: filteredTools };
    }

    // Group tools by category
    const grouped: Record<string, Tool[]> = {};
    
    filteredTools.forEach(tool => {
      if (!grouped[tool.category]) {
        grouped[tool.category] = [];
      }
      grouped[tool.category].push(tool);
    });

    // Sort categories by number of tools (most first)
    const sortedCategories = Object.keys(grouped).sort((a, b) => 
      grouped[b].length - grouped[a].length
    );
    
    // Create new object with sorted keys
    const result: Record<string, Tool[]> = {};
    sortedCategories.forEach(category => {
      result[category] = grouped[category];
    });
    
    return result;
  }, [filteredTools, selectedCategory]);

  const pinnedCount = tools.filter(tool => tool.isPinned).length;
  const recentlyUsedCount = tools.filter(tool => tool.lastUsed && 
    new Date().getTime() - new Date(tool.lastUsed).getTime() < 7 * 24 * 60 * 60 * 1000
  ).length;

  const handleSaveTool = async (toolData: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingTool) {
        // Update existing tool
        await updateTool({
          ...editingTool,
          ...toolData
        });
        toast({
          title: "Tool updated",
          description: `${toolData.name} has been updated successfully.`,
        });
      } else {
        // Add new tool
        await addTool(toolData);
        toast({
          title: "Tool added",
          description: `${toolData.name} has been added to your dashboard.`,
        });
      }
      setEditingTool(null);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save tool. Please try again.",
        variant: "destructive"
      });
      console.error("Failed to save tool:", err);
    }
  };

  const handleAIToolsGenerated = async (aiTools: Omit<Tool, 'id' | 'createdAt' | 'updatedAt' | 'isPinned'>[]) => {
    try {
      const toolsWithIsPinned = aiTools.map(tool => ({
        ...tool,
        isPinned: false
      }));
      
      await addMultipleTools(toolsWithIsPinned);
      
      toast({
        title: "AI Tools Generated",
        description: `${aiTools.length} tools have been added to your dashboard.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to generate AI tools. Please try again.",
        variant: "destructive"
      });
      console.error("Failed to generate AI tools:", err);
    }
  };

  const handleDeleteTool = async (id: string) => {
    try {
      const tool = tools.find(t => t.id === id);
      if (tool) {
        await removeTool(id);
        toast({
          title: "Tool deleted",
          description: `${tool.name} has been removed from your dashboard.`,
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete tool. Please try again.",
        variant: "destructive"
      });
      console.error("Failed to delete tool:", err);
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      await togglePin(id);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to toggle pin status. Please try again.",
        variant: "destructive"
      });
      console.error("Failed to toggle pin:", err);
    }
  };

  const handleEditTool = (tool: Tool) => {
    setEditingTool(tool);
    setIsAddModalOpen(true);
  };

  const handleToolClick = async (tool: Tool) => {
    // Update usage tracking
    try {
      await trackToolUsage(tool.id);
      window.open(tool.url, '_blank');
    } catch (err) {
      // Just open the URL even if tracking fails
      window.open(tool.url, '_blank');
      console.error("Failed to track tool usage:", err);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingTool(null);
  };

  const handleAddAITool = async (toolData: Omit<Tool, 'id' | 'createdAt' | 'updatedAt' | 'isPinned'>) => {
    try {
      await addTool({
        ...toolData,
        isPinned: false
      });
      
      toast({
        title: "Tool added",
        description: `${toolData.name} has been added to your dashboard.`,
      });
    } catch (err) {
      toast({
        title: "Error", 
        description: "Failed to add tool. Please try again.",
        variant: "destructive"
      });
      console.error("Failed to add AI tool:", err);
    }
  };

  const handleNavigateToTool = (tool: Tool) => {
    // First, update the lastUsed and usageCount
    handleToolClick(tool);
    
    // Then, select the category of the tool
    setSelectedCategory(tool.category);
    
    // Optionally, you could scroll to the tool card
    // This would require adding an id to the tool card and using scrollIntoView
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar
        categories={[
          ...categories,
          { 
            id: 'recently-used', 
            name: 'Recently Used', 
            icon: '🕒', 
            toolCount: recentlyUsedCount 
          }
        ]}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        pinnedCount={pinnedCount}
        onAIPrompt={() => setIsAIPromptOpen(true)}
      />
      
      <div className="flex-1 flex flex-col">
        <header className="border-b border-border bg-card px-4 sm:px-8 py-4 mt-12 md:mt-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center justify-between">
              <div className="w-full sm:w-auto">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center md:text-left">
                  {selectedCategory === 'all' ? 'All Tools' : 
                   selectedCategory === 'pinned' ? 'Pinned Tools' : 
                   selectedCategory === 'recently-used' ? 'Recently Used' :
                   selectedCategory}
                </h2>
                <p className="text-sm text-muted-foreground text-center md:text-left">
                  {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <div className="sm:hidden mr-8">
                <ThemeToggle />
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-4">
              <ThemeToggle />
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant={sortBy === 'recent' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSortBy('recent');
                      setSelectedCategory('all');
                    }}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Recent
                  </Button>
                  <Button
                    variant={sortBy === 'rating' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSortBy('rating');
                      setSelectedCategory('all');
                    }}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Rating
                  </Button>
                  <Button
                    variant={sortBy === 'usage' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSortBy('usage');
                      setSelectedCategory('all');
                    }}
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Usage
                  </Button>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center border rounded-md overflow-hidden h-8">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-3 rounded-none ${viewMode === 'grid' ? 'bg-muted' : ''}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-3 rounded-none ${viewMode === 'list' ? 'bg-muted' : ''}`}
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAIPromptOpen(true)}
                    className="flex items-center gap-2 ml-3"
                  >
                    <Sparkles className="h-4 w-4" />
                    AI Generate
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile-only sorting and view options */}
          <div className="flex sm:hidden items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => {
                  setSortBy('recent');
                  setSelectedCategory('all');
                }}
              >
                <Clock className="h-3 w-3 mr-1" />
                Recent
              </Button>
              <Button
                variant={sortBy === 'rating' ? 'default' : 'outline'}
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => {
                  setSortBy('rating');
                  setSelectedCategory('all');
                }}
              >
                <Star className="h-3 w-3 mr-1" />
                Rating
              </Button>
              <Button
                variant={sortBy === 'usage' ? 'default' : 'outline'}
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => {
                  setSortBy('usage');
                  setSelectedCategory('all');
                }}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Usage
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-md overflow-hidden h-8">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 rounded-none ${viewMode === 'grid' ? 'bg-muted' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 rounded-none ${viewMode === 'list' ? 'bg-muted' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-3 w-3" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAIPromptOpen(true)}
                className="h-8 flex items-center"
              >
                <Sparkles className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
            <div className="lg:col-span-3">
              <SearchBar
                onSearch={setSearchQuery}
                onAddTool={() => setIsAddModalOpen(true)}
                onAddAITool={handleAddAITool}
                onNavigateToTool={handleNavigateToTool}
                tools={tools}
              />

              {/* Tags filter */}
              <div className="mb-4">
                <div className="text-sm font-medium mb-2">Filter by tags:</div>
                <div className="flex flex-wrap gap-2">
                  {visibleTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className={`cursor-pointer ${selectedTags.includes(tag) ? "" : "text-muted-foreground"}`}
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                    >
                      {tag}
                      {selectedTags.includes(tag) && (
                        <X className="ml-1 h-3 w-3" />
                      )}
                    </Badge>
                  ))}
                  {availableTags.length > 10 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs"
                      onClick={() => setShowAllTags(!showAllTags)}
                    >
                      {showAllTags ? "Show Less" : `Show More (${availableTags.length - 10})`}
                    </Button>
                  )}
                  {selectedTags.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs"
                      onClick={() => setSelectedTags([])}
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Loading tools...
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Please wait while we fetch your tools.
                  </p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">⚠️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Error Loading Tools
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {error.message || "There was a problem loading your tools. Please try again later."}
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              ) : filteredTools.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                    <div className="w-8 h-8 bg-muted-foreground/30 rounded" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {searchQuery ? 'No tools found' : 'No tools yet'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery 
                      ? 'Try adjusting your search terms or browse different categories.'
                      : 'Start building your developer toolkit by adding your first tool or use AI to generate suggestions.'
                    }
                  </p>
                  <div className="flex gap-2 justify-center">
                    {!searchQuery && (
                      <>
                        <Button 
                          onClick={() => setIsAddModalOpen(true)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          Add Your First Tool
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setIsAIPromptOpen(true)}
                          className="flex items-center gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          Generate with AI
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                viewMode === 'grid' ? (
                  <div className="space-y-8 mt-6">
                    {Object.entries(groupedTools).map(([category, tools]) => (
                      <div key={category}>
                        <h3 className="text-lg font-medium mb-4 pb-1 border-b">
                          {category} <span className="text-muted-foreground text-sm font-normal">({tools.length})</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {tools.map((tool) => (
                            <ToolCard
                              key={tool.id}
                              tool={tool}
                              onEdit={handleEditTool}
                              onDelete={handleDeleteTool}
                              onTogglePin={handleTogglePin}
                              onToolClick={handleToolClick}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6 mt-6">
                    {Object.entries(groupedTools).map(([category, tools]) => (
                      <div key={category}>
                        <h3 className="text-lg font-medium mb-3 pb-1 border-b">
                          {category} <span className="text-muted-foreground text-sm font-normal">({tools.length})</span>
                        </h3>
                        <div className="flex flex-col gap-2">
                          {tools.map((tool) => (
                            <ToolListItem
                              key={tool.id}
                              tool={tool}
                              onEdit={handleEditTool}
                              onDelete={handleDeleteTool}
                              onTogglePin={handleTogglePin}
                              onToolClick={handleToolClick}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </main>
      </div>

      <AddToolModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveTool}
        categories={defaultCategories}
        editingTool={editingTool}
      />

      <Dialog open={isAIPromptOpen} onOpenChange={setIsAIPromptOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <AIPromptInput
            onToolsGenerated={handleAIToolsGenerated}
            onClose={() => setIsAIPromptOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
