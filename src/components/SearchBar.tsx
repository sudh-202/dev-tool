import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, ExternalLink, Loader2, Globe, Code, Palette, Server, 
  Wrench, Rocket, Zap, GraduationCap, Folder, X } from 'lucide-react';
import { searchTools } from '@/services/aiService';
import { Tool } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onAddTool: () => void;
  onAddAITool: (tool: Omit<Tool, 'id' | 'createdAt' | 'updatedAt' | 'isPinned'>) => void;
  onNavigateToTool: (tool: Tool) => void;
  tools: Tool[];
}

export function SearchBar({ 
  onSearch, 
  onAddTool, 
  onAddAITool, 
  onNavigateToTool, 
  tools 
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localResults, setLocalResults] = useState<Tool[]>([]);
  const [apiResults, setApiResults] = useState<any[]>([]);
  const debouncedQuery = useDebounce(query, 500);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Immediate local search
  useEffect(() => {
    if (query.length < 2) {
      setLocalResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const searchTerm = query.toLowerCase();
    const filtered = tools.filter(tool => 
      tool.name.toLowerCase().includes(searchTerm) ||
      tool.description?.toLowerCase().includes(searchTerm) ||
      tool.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      tool.url.toLowerCase().includes(searchTerm) ||
      tool.notes?.toLowerCase().includes(searchTerm)
    );

    setLocalResults(filtered.slice(0, 5)); // Limit to top 5 results
    setIsDropdownOpen(filtered.length > 0 || isApiLoading);
  }, [query, tools]);

  // Debounced API search
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (debouncedQuery.length < 3) {
        setApiResults([]);
        return;
      }

      setIsApiLoading(true);
      try {
        const results = await searchTools(debouncedQuery);
        
        // Filter out results that match existing tools by URL
        const filteredResults = results.filter(result => {
          return !tools.some(tool => {
            try {
              const resultDomain = new URL(result.url).hostname;
              const toolDomain = new URL(tool.url).hostname;
              return resultDomain === toolDomain;
            } catch {
              return false;
            }
          });
        });

        setApiResults(filteredResults);
        setIsDropdownOpen(localResults.length > 0 || filteredResults.length > 0);
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setIsApiLoading(false);
      }
    };

    fetchSearchResults();
  }, [debouncedQuery, tools]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  // Function to get category icon
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'frontend':
        return <Code className="h-3.5 w-3.5" />;
      case 'backend':
        return <Server className="h-3.5 w-3.5" />;
      case 'design':
        return <Palette className="h-3.5 w-3.5" />;
      case 'devops':
        return <Wrench className="h-3.5 w-3.5" />;
      case 'productivity':
        return <Zap className="h-3.5 w-3.5" />;
      case 'learning':
        return <GraduationCap className="h-3.5 w-3.5" />;
      case 'ai tools':
        return <Rocket className="h-3.5 w-3.5" />;
      default:
        return <Folder className="h-3.5 w-3.5" />;
    }
  };

  // Function to get favicon URL
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
      <div className="relative flex-1" ref={dropdownRef}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {isApiLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-primary/70" />
            <div className="flex space-x-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"></div>
            </div>
          </div>
        )}
        {query && !isApiLoading && (
          <button 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
            onClick={() => {
              setQuery('');
              onSearch('');
              setIsDropdownOpen(false);
            }}
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
        <Input
          type="text"
          placeholder="Search tools, tags, or domains..."
          value={query}
          onChange={handleSearch}
          onFocus={() => (localResults.length > 0 || apiResults.length > 0) && setIsDropdownOpen(true)}
          className="pl-10 pr-12 h-9 sm:h-11 bg-card border-border/50 focus:border-border transition-colors"
        />
        
        {isDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-card rounded-md border border-border shadow-lg max-h-[60vh] overflow-y-auto">
            <ul className="py-1 divide-y divide-border/30">
              {localResults.length > 0 && (
                <li className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/30">
                  Your Tools
                </li>
              )}
              
              {localResults.map((tool) => (
                <li 
                  key={tool.id} 
                  className="px-3 sm:px-4 py-2 hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    onNavigateToTool(tool);
                    setIsDropdownOpen(false);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-sm overflow-hidden">
                          <img 
                            src={getFaviconUrl(tool.url)} 
                            alt=""
                            className="w-full h-full"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        </div>
                        <h4 className="font-medium text-sm sm:text-base text-foreground">{tool.name}</h4>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/30 px-1.5 py-0.5 rounded">
                          {getCategoryIcon(tool.category)}
                          {tool.category}
                        </div>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground truncate">{new URL(tool.url).hostname}</p>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{tool.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}

              {apiResults.length > 0 && (
                <li className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/30 flex items-center gap-1.5">
                  <Globe className="h-3 w-3" />
                  Web Results
                </li>
              )}
              
              {apiResults.map((result, index) => (
                <li 
                  key={`web-${index}`} 
                  className="px-3 sm:px-4 py-2 hover:bg-muted/50 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-sm overflow-hidden">
                          <img 
                            src={getFaviconUrl(result.url)} 
                            alt=""
                            className="w-full h-full"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        </div>
                        <h4 className="font-medium text-sm sm:text-base text-foreground">{result.name}</h4>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                          {result.category || 'Other'}
                        </div>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground truncate">
                          {(() => {
                            try {
                              return new URL(result.url).hostname;
                            } catch {
                              return result.url;
                            }
                          })()}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{result.description}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(result.url, '_blank')}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onAddAITool({
                            name: result.name,
                            url: result.url,
                            description: result.description,
                            category: result.category || 'Other',
                            tags: result.tags || [],
                          });
                          setIsDropdownOpen(false);
                        }}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
              
              {!isApiLoading && localResults.length === 0 && apiResults.length === 0 && (
                <>
                  <li className="px-4 py-3 text-sm text-muted-foreground text-center">
                    No matching tools found. Would you like to add a new tool?
                  </li>
                  <li className="px-4 py-2 flex justify-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        onAddTool();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-1 h-8 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Tool
                    </Button>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
      
      {/* Mobile add button */}
      <Button
        onClick={onAddTool}
        className="sm:hidden h-10 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground"
      >
        <Plus className="h-5 w-5" />
        Add Tool
      </Button>
      
      {/* Desktop add button */}
      <Button
        onClick={onAddTool}
        className="hidden sm:flex items-center gap-1 h-11"
      >
        <Plus className="h-4 w-4" />
        <span>Add Tool</span>
      </Button>
    </div>
  );
}
