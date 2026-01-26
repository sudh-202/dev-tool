
import { useState, useMemo } from 'react';
import { Tool } from '@/types';
import { ToolCard } from './ToolCard';
import { TrendingUp, Filter } from 'lucide-react';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MostUsedToolsProps {
    tools: Tool[];
    onToolClick: (tool: Tool) => void;
    onEdit: (tool: Tool) => void;
    onDelete: (id: string) => void;
    onTogglePin: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    onAddToCategory?: (toolId: string, categoryName: string) => void;
    availableCategories?: string[];
}

export function MostUsedTools({
    tools,
    onToolClick,
    onEdit,
    onDelete,
    onTogglePin,
    onToggleFavorite,
    onAddToCategory,
    availableCategories,
}: MostUsedToolsProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    // Filter tools that have been used
    const usedTools = useMemo(() => {
        return tools
            .filter((tool) => (tool.usageCount || 0) > 0)
            .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    }, [tools]);

    // Extract categories from used tools for the filter
    const filterCategories = useMemo(() => {
        const categories = new Set<string>(['All']);
        usedTools.forEach((tool) => {
            tool.categories.forEach((cat) => categories.add(cat));
        });
        return Array.from(categories).sort();
    }, [usedTools]);

    // Filter displayed tools based on selection
    const displayedTools = useMemo(() => {
        if (selectedCategory === 'All') {
            return usedTools.slice(0, 6);
        }
        return usedTools
            .filter((tool) => tool.categories.includes(selectedCategory))
            .slice(0, 6);
    }, [usedTools, selectedCategory]);

    if (usedTools.length === 0) {
        return null;
    }

    return (
        <div className="mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Most Used Tools</h2>
                        <p className="text-sm text-muted-foreground">
                            Your frequently accessed tools
                        </p>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Filter className="h-4 w-4" />
                            {selectedCategory}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {filterCategories.map((category) => (
                            <DropdownMenuItem
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={selectedCategory === category ? 'bg-accent' : ''}
                            >
                                {category}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedTools.map((tool) => (
                    <div key={tool.id} className="h-full">
                        <ToolCard
                            tool={tool}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onTogglePin={onTogglePin}
                            onToggleFavorite={onToggleFavorite}
                            onToolClick={onToolClick}
                            onAddToCategory={onAddToCategory}
                            availableCategories={availableCategories}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
