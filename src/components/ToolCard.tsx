import { useState } from 'react';
import { Tool } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, BookmarkCheck, Clock, TrendingUp, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { ToolRating } from './ToolRating';
import { cn } from '@/lib/utils';

interface ToolCardProps {
  tool: Tool;
  onEdit: (tool: Tool) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToolClick: (tool: Tool) => void;
}

export function ToolCard({ tool, onEdit, onDelete, onTogglePin, onToolClick }: ToolCardProps) {
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
    <Card className="group h-full bg-card border-border/50 hover:border-border hover:shadow-sm transition-all duration-200 animate-fade-in">
      <CardContent className="p-3 sm:p-6">
        <div className="flex items-start justify-between mb-2 sm:mb-4">
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
              <h3 className="font-semibold text-sm sm:text-base text-foreground truncate group-hover:text-primary transition-colors">
                {tool.name}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {new URL(tool.url).hostname}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTogglePin(tool.id)}
            className={cn(
              "p-1 h-auto w-auto", 
              tool.isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
            )}
          >
            {tool.isPinned ? (
              <BookmarkCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            ) : (
              <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        {tool.description && (
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4 line-clamp-2">
            {tool.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-2 sm:mb-4">
          {tool.rating && tool.rating > 0 && (
            <ToolRating rating={tool.rating} onRatingChange={() => {}} readonly />
          )}
          {tool.usageCount && tool.usageCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              {tool.usageCount}
            </div>
          )}
          {daysSinceLastUsed !== null && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {daysSinceLastUsed === 0 ? 'Today' : `${daysSinceLastUsed}d ago`}
            </div>
          )}
        </div>

        {tool.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2 sm:mb-4">
            {tool.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs bg-muted/50 text-muted-foreground hover:bg-muted/70 border-0 px-1.5 py-0"
              >
                {tag}
              </Badge>
            ))}
            {tool.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-muted/50 text-muted-foreground border-0 px-1.5 py-0">
                +{tool.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Mobile Action Buttons */}
        <div className="flex items-center gap-1 sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToolClick(tool)}
            className="flex-1 h-7 text-xs bg-background hover:bg-accent border-border/50"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Visit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(tool)}
            className="h-7 w-7 text-xs hover:bg-accent"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(tool.id)}
            className="h-7 w-7 text-xs hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToolClick(tool)}
            className="flex-1 h-8 text-xs bg-background hover:bg-accent border-border/50"
          >
            Visit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(tool)}
            className="h-8 px-3 text-xs hover:bg-accent"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(tool.id)}
            className="h-8 px-3 text-xs hover:bg-destructive/10 hover:text-destructive"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
