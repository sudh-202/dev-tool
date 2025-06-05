import { useState } from 'react';
import { Tool } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, BookmarkCheck, Clock, TrendingUp, Star, ExternalLink, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { ToolRating } from './ToolRating';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ToolListItemProps {
  tool: Tool;
  onEdit: (tool: Tool) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToolClick: (tool: Tool) => void;
}

export function ToolListItem({ tool, onEdit, onDelete, onTogglePin, onToolClick }: ToolListItemProps) {
  const [imageError, setImageError] = useState(false);
  
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  const faviconUrl = getFaviconUrl(tool.url);
  const daysSinceLastUsed = tool.lastUsed 
    ? Math.floor((new Date().getTime() - new Date(tool.lastUsed).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="group flex items-center bg-card border border-border/50 hover:border-border hover:shadow-sm transition-all duration-200 rounded-md p-2 sm:p-3 animate-fade-in">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        {faviconUrl && !imageError ? (
          <img
            src={faviconUrl}
            alt=""
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-sm flex-shrink-0"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-muted rounded-sm flex items-center justify-center flex-shrink-0">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-muted-foreground/30 rounded-sm" />
          </div>
        )}
        
        <div className="min-w-0 flex-1">
          <div className="flex items-center">
            <h3 className="font-semibold text-sm sm:text-base text-foreground truncate group-hover:text-primary transition-colors">
              {tool.name}
            </h3>
            {tool.isPinned && (
              <BookmarkCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary ml-1 sm:ml-2 flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
            <span className="truncate">{new URL(tool.url).hostname}</span>
            {tool.category && (
              <Badge variant="outline" className="text-xs bg-muted/50 border-0 hidden sm:inline-flex px-1.5 py-0">
                {tool.category}
              </Badge>
            )}
          </div>
        </div>
        
        {tool.description && (
          <p className="hidden md:block text-xs sm:text-sm text-muted-foreground max-w-md truncate">
            {tool.description}
          </p>
        )}
      </div>
      
      {/* Mobile actions */}
      <div className="flex sm:hidden items-center gap-1 ml-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToolClick(tool)}
          className="h-7 w-7"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onTogglePin(tool.id)}>
              {tool.isPinned ? (
                <><BookmarkCheck className="h-3.5 w-3.5 mr-2" /> Unpin</>
              ) : (
                <><Bookmark className="h-3.5 w-3.5 mr-2" /> Pin</>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(tool)}>
              <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(tool.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Tablet and desktop actions */}
      <div className="hidden sm:flex items-center gap-2 ml-4">
        {tool.rating && tool.rating > 0 && (
          <div className="hidden lg:flex">
            <ToolRating rating={tool.rating} onRatingChange={() => {}} readonly />
          </div>
        )}
        
        {(tool.usageCount || daysSinceLastUsed !== null) && (
          <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground border-l border-border/50 pl-2">
            {tool.usageCount && tool.usageCount > 0 && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {tool.usageCount}
              </div>
            )}
            {daysSinceLastUsed !== null && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {daysSinceLastUsed === 0 ? 'Today' : `${daysSinceLastUsed}d ago`}
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToolClick(tool)}
            className="h-8 px-2"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTogglePin(tool.id)}
            className="h-8 px-2"
          >
            {tool.isPinned ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(tool)}
            className="h-8 px-2"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(tool.id)}
            className="h-8 px-2 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 