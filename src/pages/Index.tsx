import { useState, useEffect, useMemo } from "react";
import { Tool, Category } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useSupabaseTools } from "@/hooks/useSupabaseTools";
import { Sidebar } from "@/components/Sidebar";
import { SearchBar } from "@/components/SearchBar";
import { ToolCard } from "@/components/ToolCard";
import { ToolListItem } from "@/components/ToolListItem";
import { AddToolModal } from "@/components/AddToolModal";
import { AIPromptInput } from "@/components/AIPromptInput";
import { ThemeToggle } from "@/components/ThemeToggle";
// import { Logo } from '@/components/Logo';
import { QuickNotes } from "@/components/QuickNotes";
import { Button } from "@/components/ui/button";
import { MostUsedTools } from "@/components/MostUsedTools";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Clock,
  TrendingUp,
  Grid,
  List,
  Loader2,
  X,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  recoverTools,
  checkAndFixCategoriesColumn,
} from "@/services/supabaseService";
import { exportToolsAsCSV, exportToolsAsJSON } from "@/utils/exportUtils";
import { importToolsFromCSV, importToolsFromJSON } from "@/utils/importUtils";

const defaultCategories = [
  "Frontend",
  "Backend",
  "AI Tools",
  "Design",
  "DevOps",
  "Productivity",
  "Learning",
  "Other",
];

const sampleTools: Tool[] = [
  {
    id: "1",
    name: "React",
    url: "https://reactjs.org",
    description: "A JavaScript library for building user interfaces",
    tags: ["frontend", "javascript", "ui"],
    categories: ["Frontend"],
    category: "Frontend",
    isPinned: true,
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Vercel",
    url: "https://vercel.com",
    description: "Deploy web projects with zero configuration",
    tags: ["deployment", "hosting", "frontend"],
    categories: ["DevOps", "Frontend"],
    category: "DevOps",
    isPinned: false,
    isFavorite: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Figma",
    url: "https://figma.com",
    description: "Collaborative interface design tool",
    tags: ["design", "ui", "collaboration"],
    categories: ["Design"],
    category: "Design",
    isPinned: true,
    isFavorite: false,
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
    toggleFavorite,
    addToolToCategory,
    removeToolFromCategory,
    removeTool,
    trackToolUsage,
    refreshTools,
    runDiagnostics,
  } = useSupabaseTools();

  const [selectedCategory, setSelectedCategory] = useState("all");

  // Reset category filter when switching away from categories view
  useEffect(() => {
    if (selectedCategory !== "categories") {
      setSelectedCategoryFilter("all");
    }
  }, [selectedCategory]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAIPromptOpen, setIsAIPromptOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "usage">("recent");
  const [viewMode, setViewMode] = useLocalStorage<"grid" | "list">(
    "view-mode",
    "grid"
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customCategories, setCustomCategories] = useLocalStorage<string[]>(
    "custom-categories",
    []
  );
  const [deletedCategories, setDeletedCategories] = useLocalStorage<string[]>(
    "deleted-categories",
    []
  );

  const allCategoryNames = useMemo(() => {
    return [...defaultCategories, ...customCategories].filter(
      (category) => !deletedCategories.includes(category) // Filter out deleted categories
    );
  }, [customCategories, deletedCategories]);

  // Import functionality
  const [importType, setImportType] = useState<'csv' | 'json' | null>(null);

  const handleImportClick = (type: 'csv' | 'json') => {
    setImportType(type);
    const fileInput = document.getElementById('import-file-input');
    if (fileInput) {
      (fileInput as HTMLInputElement).click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !importType) return;

    try {
      let importedTools: any[] = [];

      if (importType === 'csv') {
        importedTools = await importToolsFromCSV(file);
      } else {
        importedTools = await importToolsFromJSON(file);
      }

      if (importedTools.length === 0) {
        toast({
          title: "No tools found",
          description: "No valid tools were found in the imported file.",
          variant: "destructive",
        });
        return;
      }

      // Add imported tools
      await addMultipleTools(importedTools);

      toast({
        title: "Import Successful",
        description: `Successfully imported ${importedTools.length} tools.`,
      });

      // Reset input
      event.target.value = '';
      setImportType(null);
    } catch (err) {
      console.error("Import failed:", err);
      toast({
        title: "Import Failed",
        description: err instanceof Error ? err.message : "Failed to import tools.",
        variant: "destructive",
      });
      event.target.value = '';
      setImportType(null);
    }
  };

  const categories: Category[] = useMemo(() => {
    const categoryMap = new Map<string, number>();

    allCategoryNames.forEach((cat) => categoryMap.set(cat, 0));

    tools.forEach((tool) => {
      // Handle compatibility with older data format
      const toolCategories =
        tool.categories || (tool.category ? [tool.category] : []);

      toolCategories.forEach((category) => {
        const count = categoryMap.get(category) || 0;
        categoryMap.set(category, count + 1);
      });
    });

    return Array.from(categoryMap.entries()).map(([name, toolCount]) => ({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      icon: "📁",
      toolCount,
    }));
  }, [tools, customCategories, allCategoryNames]);

  // Get all unique tags across tools
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    tools.forEach((tool) => {
      tool.tags.forEach((tag) => tagsSet.add(tag));
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
    if (selectedCategory === "pinned") {
      filtered = filtered.filter((tool) => tool.isPinned);
    } else if (selectedCategory === "favorites") {
      filtered = filtered.filter((tool) => tool.isFavorite);
    } else if (selectedCategory === "recently-used") {
      filtered = filtered.filter((tool) => tool.lastUsed);
    } else if (selectedCategory === "categories") {
      // For categories view, show all tools (they will be grouped by category later)
    } else if (selectedCategory !== "all") {
      filtered = filtered.filter((tool) => {
        // Handle compatibility with older data format
        const toolCategories =
          tool.categories || (tool.category ? [tool.category] : []);
        return toolCategories.includes(selectedCategory);
      });
    }

    // Filter by tags if any are selected
    if (selectedTags.length > 0) {
      filtered = filtered.filter((tool) =>
        selectedTags.some((tag) => tool.tags.includes(tag))
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.description?.toLowerCase().includes(query) ||
          tool.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          tool.url.toLowerCase().includes(query) ||
          tool.notes?.toLowerCase().includes(query)
      );
    }

    // Sort tools
    return filtered.sort((a, b) => {
      if (sortBy === "usage") {
        return (b.usageCount || 0) - (a.usageCount || 0);
      } else {
        // Default: pinned first, then by creation date
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    });
  }, [tools, selectedCategory, searchQuery, sortBy, selectedTags]);

  // Group tools by category for "pinned", "favorites", and "categories" views, show flat list for "all"
  const groupedTools = useMemo(() => {
    if (selectedCategory === "all") {
      // For "all" view, show tools in a flat list without grouping by category
      return { "All Tools": filteredTools };
    } else if (
      selectedCategory === "pinned" ||
      selectedCategory === "favorites" ||
      selectedCategory === "categories"
    ) {
      // Group tools by category for "pinned", "favorites", and "categories" views
      const grouped: Record<string, Tool[]> = {};

      filteredTools.forEach((tool) => {
        // Handle compatibility with older data format
        const toolCategories = tool.categories?.length
          ? tool.categories
          : tool.category
            ? [tool.category]
            : ["Uncategorized"];

        // Add the tool to each of its categories
        toolCategories.forEach((category) => {
          if (!grouped[category]) {
            grouped[category] = [];
          }
          grouped[category].push(tool);
        });
      });

      // Sort categories by number of tools (most first)
      const sortedCategories = Object.keys(grouped).sort(
        (a, b) => grouped[b].length - grouped[a].length
      );

      // Create new object with sorted keys
      const result: Record<string, Tool[]> = {};
      sortedCategories.forEach((category) => {
        result[category] = grouped[category];
      });

      return result;
    } else {
      // For specific category views
      return { [selectedCategory]: filteredTools };
    }
  }, [filteredTools, selectedCategory]);

  // Category filter state for Categories view
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("all");

  // Get unique categories from tools for filtering
  const availableCategoriesForFilter = useMemo(() => {
    const categorySet = new Set<string>();
    tools.forEach((tool) => {
      const toolCategories = tool.categories?.length
        ? tool.categories
        : tool.category
          ? [tool.category]
          : ["Uncategorized"];
      toolCategories.forEach((category) => categorySet.add(category));
    });
    return Array.from(categorySet).sort();
  }, [tools]);

  // Filter grouped tools by selected category filter
  const filteredGroupedTools = useMemo(() => {
    if (selectedCategory === "categories" && selectedCategoryFilter !== "all") {
      // Filter to show only the selected category
      const filtered = Object.entries(groupedTools).filter(
        ([category]) => category === selectedCategoryFilter
      );
      return Object.fromEntries(filtered);
    }
    return groupedTools;
  }, [groupedTools, selectedCategory, selectedCategoryFilter]);

  const pinnedCount = tools.filter((tool) => tool.isPinned).length;
  const favoritesCount = tools.filter((tool) => tool.isFavorite).length;
  const allToolsCount = tools.length; // Total unique tools

  // Calculate number of unique categories
  const categoriesCount = useMemo(() => {
    const categorySet = new Set<string>();
    tools.forEach((tool) => {
      const toolCategories = tool.categories?.length
        ? tool.categories
        : tool.category
          ? [tool.category]
          : ["Uncategorized"];
      toolCategories.forEach((category) => categorySet.add(category));
    });
    return categorySet.size;
  }, [tools]);

  const recentlyUsedCount = tools.filter(
    (tool) =>
      tool.lastUsed &&
      new Date().getTime() - new Date(tool.lastUsed).getTime() <
      7 * 24 * 60 * 60 * 1000
  ).length;

  const handleSaveTool = async (
    toolData: Omit<Tool, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      if (editingTool) {
        // Update existing tool
        await updateTool({
          ...editingTool,
          ...toolData,
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
        variant: "destructive",
      });
      console.error("Failed to save tool:", err);
    }
  };

  const handleAIToolsGenerated = async (
    aiTools: Omit<Tool, "id" | "createdAt" | "updatedAt" | "isPinned">[]
  ) => {
    try {
      const toolsWithIsPinned = aiTools.map((tool) => ({
        ...tool,
        isPinned: false,
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
        variant: "destructive",
      });
      console.error("Failed to generate AI tools:", err);
    }
  };

  const handleDeleteTool = async (id: string) => {
    try {
      const tool = tools.find((t) => t.id === id);
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
        variant: "destructive",
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
        variant: "destructive",
      });
      console.error("Failed to toggle pin:", err);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavorite(id);
      toast({
        title: "Favorites updated",
        description: "Tool has been updated in your favorites.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to toggle favorite:", err);
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
      window.open(tool.url, "_blank");
    } catch (err) {
      // Just open the URL even if tracking fails
      window.open(tool.url, "_blank");
      console.error("Failed to track tool usage:", err);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingTool(null);
  };

  const handleAddAITool = async (
    toolData: Omit<Tool, "id" | "createdAt" | "updatedAt" | "isPinned">
  ) => {
    try {
      await addTool({
        ...toolData,
        isPinned: false,
      });

      toast({
        title: "Tool added",
        description: `${toolData.name} has been added to your dashboard.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add tool. Please try again.",
        variant: "destructive",
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

  // Handle creating a new custom category
  const handleCreateCategory = (categoryName: string) => {
    if (categoryName) {
      // Check if it was previously deleted default category
      if (
        defaultCategories.includes(categoryName) &&
        deletedCategories.includes(categoryName)
      ) {
        // Remove from deleted categories to restore it
        setDeletedCategories((prev) =>
          prev.filter((cat) => cat !== categoryName)
        );

        // Optionally switch to the restored category
        setSelectedCategory(categoryName);

        toast({
          title: "Category restored",
          description: `"${categoryName}" category has been restored.`,
        });
      }
      // Check if it's a new custom category
      else if (!allCategoryNames.includes(categoryName)) {
        setCustomCategories((prev) => [...prev, categoryName]);

        // Optionally switch to the new category
        setSelectedCategory(categoryName);

        toast({
          title: "Category created",
          description: `"${categoryName}" has been added to your categories.`,
        });
      }
    }
  };

  // Handle deleting a category and moving its tools to "Other"
  const handleDeleteCategory = async (categoryName: string) => {
    // Don't allow deleting the "Other" category
    if (categoryName === "Other") {
      toast({
        title: "Cannot delete Other category",
        description:
          "The 'Other' category cannot be deleted as it's used as a fallback for uncategorized tools.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find all tools in this category
      const toolsInCategory = tools.filter((tool) =>
        tool.categories.includes(categoryName)
      );

      // Update each tool to move from this category to "Other"
      for (const tool of toolsInCategory) {
        const updatedCategories = tool.categories
          .filter((cat) => cat !== categoryName)
          .concat(tool.categories.includes("Other") ? [] : ["Other"]);

        await updateTool({
          ...tool,
          categories: updatedCategories,
        });
      }

      // If it's a custom category, remove it from custom categories
      if (customCategories.includes(categoryName)) {
        setCustomCategories((prev) =>
          prev.filter((cat) => cat !== categoryName)
        );
      }
      // If it's a default category, add it to deleted categories
      else if (defaultCategories.includes(categoryName)) {
        setDeletedCategories((prev) => [...prev, categoryName]);
      }

      // If we're currently viewing the deleted category, switch to "all"
      if (selectedCategory === categoryName) {
        setSelectedCategory("all");
      }

      toast({
        title: "Category deleted",
        description: `Category "${categoryName}" has been deleted and its tools moved to "Other".`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to delete category:", err);
    }
  };

  // Helper function to add a tool to a new category
  const handleAddToolToCategory = async (
    toolId: string,
    categoryName: string
  ) => {
    try {
      const tool = tools.find((t) => t.id === toolId);
      if (!tool) {
        toast({
          title: "Error",
          description: "Tool not found.",
          variant: "destructive",
        });
        return;
      }

      // Check if tool already has this category
      if (tool.categories.includes(categoryName)) {
        toast({
          title: "Category exists",
          description: `Tool is already in the "${categoryName}" category.`,
        });
        return;
      }

      // Add the tool to the new category using the addToolToCategory function
      await addToolToCategory(toolId, categoryName);

      toast({
        title: "Category added",
        description: `Tool has been added to the "${categoryName}" category.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add tool to category. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to add tool to category:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar
        categories={[
          ...categories,
          {
            id: "recently-used",
            name: "Recently Used",
            icon: "🕒",
            toolCount: recentlyUsedCount,
          },
        ]}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        pinnedCount={pinnedCount}
        favoritesCount={favoritesCount}
        allToolsCount={allToolsCount}
        categoriesCount={categoriesCount}
        onAIPrompt={() => setIsAIPromptOpen(true)}
        onCreateCategory={handleCreateCategory}
        onDeleteCategory={handleDeleteCategory}
        customCategories={customCategories}
      />

      <div className="flex-1 flex flex-col md:ml-60">
        <header className="border-b border-border bg-card px-4 sm:px-8 py-4 mt-12 md:mt-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center justify-between">
              <div className="w-full sm:w-auto">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center md:text-left">
                  {selectedCategory === "all"
                    ? "All Tools"
                    : selectedCategory === "pinned"
                      ? "Pinned Tools"
                      : selectedCategory === "favorites"
                        ? "Favorites"
                        : selectedCategory === "categories"
                          ? "Categories"
                          : selectedCategory === "recently-used"
                            ? "Recently Used"
                            : selectedCategory}
                </h2>
                <p className="text-sm text-muted-foreground text-center md:text-left">
                  {filteredTools.length} tool
                  {filteredTools.length !== 1 ? "s" : ""} found
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
                    variant={sortBy === "recent" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSortBy("recent");
                      setSelectedCategory("all");
                    }}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Recent
                  </Button>

                  <Button
                    variant={sortBy === "usage" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSortBy("usage");
                      setSelectedCategory("all");
                    }}
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Usage
                  </Button>
                  {/* Debug and Recovery utilities */}
                  <div className=" flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs">
                          <Download className="h-3 w-3 mr-1" />
                          Manage
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        <DropdownMenuItem
                          onClick={() => exportToolsAsCSV(tools)}
                        >
                          Export Tools (CSV)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => exportToolsAsJSON(tools)}
                        >
                          Export Tools (JSON)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleImportClick('csv')}
                        >
                          Import Tools (CSV)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleImportClick('json')}
                        >
                          Import Tools (JSON)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {/* <DropdownMenuItem 
                      onClick={async () => {
                        const recovered = await recoverTools();
                        if (recovered) {
                          refreshTools();
                        }
                      }}
                    >
                      Recover Missing Tools
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => runDiagnostics()}
                    >
                      Run Database Diagnostics
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => checkAndFixCategoriesColumn()}
                    >
                      Fix Categories Format
                    </DropdownMenuItem> */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center border rounded-md overflow-hidden h-8">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-3 rounded-none ${viewMode === "grid" ? "bg-muted" : ""
                        }`}
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-3 rounded-none ${viewMode === "list" ? "bg-muted" : ""
                        }`}
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-only sorting and view options */}
          <div className="flex sm:hidden items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={sortBy === "recent" ? "default" : "outline"}
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => {
                  setSortBy("recent");
                  setSelectedCategory("all");
                }}
              >
                <Clock className="h-3 w-3 mr-1" />
                Recent
              </Button>

              <Button
                variant={sortBy === "usage" ? "default" : "outline"}
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => {
                  setSortBy("usage");
                  setSelectedCategory("all");
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
                  className={`h-8 px-2 rounded-none ${viewMode === "grid" ? "bg-muted" : ""
                    }`}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 rounded-none ${viewMode === "list" ? "bg-muted" : ""
                    }`}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-3 w-3" />
                </Button>
              </div>
              {/* Export button at top of dashboard */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex items-center gap-1"
                    title="Export tools"
                  >
                    <Download className="h-3 w-3" />
                    <span className="hidden sm:inline">Manage</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-44">
                  <DropdownMenuItem onClick={() => exportToolsAsCSV(tools)}>
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToolsAsJSON(tools)}>
                    Export JSON
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleImportClick('csv')}>
                    Import CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleImportClick('json')}>
                    Import JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

              {/* Most Used Tools Section */}
              {!loading && !error && !searchQuery && selectedCategory === 'all' && (
                <MostUsedTools
                  tools={tools}
                  onToolClick={handleToolClick}
                  onEdit={handleEditTool}
                  onDelete={handleDeleteTool}
                  onTogglePin={handleTogglePin}
                  onToggleFavorite={handleToggleFavorite}
                  onAddToCategory={handleAddToolToCategory}
                  availableCategories={allCategoryNames}
                />
              )}

              {/* Tags filter */}
              <div className="mb-4">
                <div className="text-sm font-medium mb-2">Filter by tags:</div>
                <div className="flex flex-wrap gap-2">
                  {visibleTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={
                        selectedTags.includes(tag) ? "default" : "outline"
                      }
                      className={`cursor-pointer ${selectedTags.includes(tag)
                        ? ""
                        : "text-muted-foreground"
                        }`}
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(
                            selectedTags.filter((t) => t !== tag)
                          );
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
                      {showAllTags
                        ? "Show Less"
                        : `Show More (${availableTags.length - 10})`}
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

                  {selectedCategory === "categories" && (
                    <div className="mt-4">
                      <div className="flex flex-col gap-3">
                        <div>
                          <h3 className="text-sm font-medium text-foreground mb-2">
                            Filter by Category
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {selectedCategoryFilter === "all"
                              ? `Showing all categories (${filteredTools.length} tools)`
                              : `Showing ${selectedCategoryFilter} (${filteredGroupedTools[selectedCategoryFilter]
                                ?.length || 0
                              } tools)`}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={
                              selectedCategoryFilter === "all"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setSelectedCategoryFilter("all")}
                            className="h-8 px-3 text-xs"
                          >
                            All Categories
                          </Button>
                          {availableCategoriesForFilter.map((category) => (
                            <Button
                              key={category}
                              variant={
                                selectedCategoryFilter === category
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                setSelectedCategoryFilter(category)
                              }
                              className="h-8 px-3 text-xs"
                            >
                              {category}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
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
                    {error.message ||
                      "There was a problem loading your tools. Please try again later."}
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
                    {searchQuery ? "No tools found" : "No tools yet"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? "Try adjusting your search terms or browse different categories."
                      : "Start building your developer toolkit by adding your first tool or use AI to generate suggestions."}
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
              ) : viewMode === "grid" ? (
                <div className="space-y-8 mt-6">
                  {Object.entries(filteredGroupedTools).map(
                    ([category, tools]) => (
                      <div key={category}>
                        <h3 className="text-lg font-medium mb-4 pb-1 border-b">
                          {category}{" "}
                          <span className="text-muted-foreground text-sm font-normal">
                            ({tools.length})
                          </span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {tools.map((tool) => (
                            <ToolCard
                              key={tool.id}
                              tool={tool}
                              onEdit={handleEditTool}
                              onDelete={handleDeleteTool}
                              onTogglePin={handleTogglePin}
                              onToggleFavorite={handleToggleFavorite}
                              onToolClick={handleToolClick}
                              onAddToCategory={handleAddToolToCategory}
                              availableCategories={allCategoryNames}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="space-y-6 mt-6">
                  {Object.entries(filteredGroupedTools).map(
                    ([category, tools]) => (
                      <div key={category}>
                        <h3 className="text-lg font-medium mb-3 pb-1 border-b">
                          {category}{" "}
                          <span className="text-muted-foreground text-sm font-normal">
                            ({tools.length})
                          </span>
                        </h3>
                        <div className="flex flex-col gap-2">
                          {tools.map((tool) => (
                            <ToolListItem
                              key={tool.id}
                              tool={tool}
                              onEdit={handleEditTool}
                              onDelete={handleDeleteTool}
                              onTogglePin={handleTogglePin}
                              onToggleFavorite={handleToggleFavorite}
                              onToolClick={handleToolClick}
                              onAddToCategory={handleAddToolToCategory}
                              availableCategories={allCategoryNames}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <AddToolModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveTool}
        categories={allCategoryNames}
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

      {/* Hidden file input for imports */}
      <input
        type="file"
        id="import-file-input"
        className="hidden"
        accept={importType === 'csv' ? ".csv" : ".json"}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default Index;
