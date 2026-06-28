import { useState } from 'react';
import { Tool } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Clock, TrendingUp, ExternalLink,
  Pencil, Trash2, Heart, FolderPlus, Bookmark, BookmarkCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface ToolCardProps {
  tool: Tool;
  onEdit: (tool: Tool) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToolClick: (tool: Tool) => void;
  onAddToCategory?: (toolId: string, categoryName: string) => void;
  availableCategories?: string[];
  isBookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
}

export function ToolCard({ tool, onEdit, onDelete, onTogglePin, onToggleFavorite, onToolClick, onAddToCategory, availableCategories, isBookmarked, onToggleBookmark }: ToolCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  // Pinned + Favorites are merged into a single "saved" concept (the heart).
  const isSaved = tool.isFavorite || tool.isPinned;
  const faviconUrl = getFaviconUrl(tool.url);
  const daysSinceLastUsed = tool.lastUsed
    ? Math.floor((new Date().getTime() - new Date(tool.lastUsed).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="group h-full bg-card border-border/50 hover:border-border hover:shadow-sm transition-all duration-200 animate-fade-in overflow-hidden">
      <CardContent className="p-2 sm:p-3">
        <div className="flex items-start justify-between mb-1 sm:mb-2">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
            {faviconUrl && !imageError ? (
              <img
                src={faviconUrl}
                alt=""
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-sm flex-shrink-0"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-muted rounded-sm flex items-center justify-center flex-shrink-0">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-muted-foreground/30 rounded-sm" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
                {tool.name}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {new URL(tool.url).hostname}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            {onToggleBookmark && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleBookmark(tool.id)}
                title={isBookmarked ? "Remove from bookmarks bar" : "Add to bookmarks bar"}
                className={cn(
                  "p-0.5 h-auto w-auto",
                  isBookmarked ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
                )}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-foreground" />
                ) : (
                  <Bookmark className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleFavorite(tool.id)}
              title={isSaved ? "Remove from favorites" : "Add to favorites"}
              className={cn(
                "p-0.5 h-auto w-auto",
                isSaved ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
              )}
            >
              <Heart
                className={cn(
                  "h-3 w-3 sm:h-3.5 sm:w-3.5",
                  isSaved ? "text-rose-500 fill-rose-500" : "text-muted-foreground"
                )}
              />
            </Button>
          </div>
        </div>

        {tool.description && (
          <p className="text-xs text-muted-foreground mb-1.5 sm:mb-2 line-clamp-2">
            {tool.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
          {tool.usageCount && tool.usageCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-2.5 w-2.5" />
              {tool.usageCount}
            </div>
          )}
          {daysSinceLastUsed !== null && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-2.5 w-2.5" />
              {daysSinceLastUsed === 0 ? 'Today' : `${daysSinceLastUsed}d ago`}
            </div>
          )}
        </div>

        {/* Action Buttons - One compact row for all screen sizes */}
        <div className="flex items-center gap-1 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToolClick(tool)}
            className="flex-1 h-6 text-[10px] sm:text-xs bg-background hover:bg-accent border-border/50 px-1 sm:px-2 min-w-0 inline-flex items-center justify-center"
          >
            <ExternalLink className="h-2.5 w-2.5 mr-0.5 sm:mr-1 flex-shrink-0" />
            <span className="truncate">Visit</span>
          </Button>
          
          {/* Add to Category dropdown */}
          {onAddToCategory && availableCategories && availableCategories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1 sm:px-1.5 text-[10px] sm:text-xs hover:bg-accent min-w-0 inline-flex items-center justify-center"
                  onClick={(e) => {
                    // Prevent event bubbling that might trigger other actions
                    e.stopPropagation();
                  }}
                >
                  <FolderPlus className="h-2.5 w-2.5 mr-0.5 sm:mr-1 flex-shrink-0" />
                  <span className="truncate">Add to</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-64 overflow-auto">
                {availableCategories
                  .filter(category => !tool.categories.includes(category))
                  .map(category => (
                    <DropdownMenuItem
                      key={category}
                      onClick={(e) => {
                        // Prevent event bubbling
                        e.stopPropagation();
                        // Add to category with error handling
                        try {
                          onAddToCategory(tool.id, category);
                        } catch (err) {
                          console.error("Error adding to category:", err);
                        }
                      }}
                    >
                      {category}
                    </DropdownMenuItem>
                  ))}
                {availableCategories.filter(category => !tool.categories.includes(category)).length === 0 && (
                  <DropdownMenuItem disabled>
                    No more categories available
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(tool)}
            className="h-6 px-1 sm:px-1.5 text-[10px] sm:text-xs hover:bg-accent min-w-0 inline-flex items-center justify-center"
          >
            <Pencil className="h-2.5 w-2.5 mr-0.5 sm:mr-1 flex-shrink-0" />
            <span className="truncate">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(tool.id)}
            className="h-6 px-1 sm:px-1.5 text-[10px] sm:text-xs hover:bg-destructive/10 hover:text-destructive min-w-0 inline-flex items-center justify-center"
          >
            <Trash2 className="h-2.5 w-2.5 mr-0.5 sm:mr-1 flex-shrink-0" />
            <span className="truncate">Delete</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
