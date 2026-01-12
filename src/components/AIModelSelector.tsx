import { useState, useEffect } from 'react';
import { useAIProvider } from '@/contexts/AIProviderContext';
import { Button } from '@/components/ui/button';
import { Settings, Sparkles, ExternalLink, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from './ui/badge';
import { toast } from '@/hooks/use-toast';
import type { AIProvider } from '@/services/aiService';

interface AIModelSelectorProps {
  variant?: 'default' | 'sidebar';
}

export function AIModelSelector({ variant = 'default' }: AIModelSelectorProps) {
  const { currentProvider, setCurrentProvider, availableProviders } = useAIProvider();
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorite_ai_providers');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Failed to parse favorites', e);
      }
    }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, providerId: string) => {
    e.stopPropagation(); // Prevent dropdown from closing
    e.preventDefault();
    
    let newFavorites;
    if (favorites.includes(providerId)) {
      newFavorites = favorites.filter(id => id !== providerId);
    } else {
      newFavorites = [...favorites, providerId];
    }
    
    setFavorites(newFavorites);
    localStorage.setItem('favorite_ai_providers', JSON.stringify(newFavorites));
  };
  
  const handleProviderChange = (providerId: string) => {
    setCurrentProvider(providerId as AIProvider);
    toast({
      title: 'AI Provider Changed',
      description: `Now using ${getProviderDisplayName(providerId)} for AI operations`,
    });
  };
  
  const getProviderDisplayName = (providerId: string) => {
    switch(providerId) {
      case 'openai': return 'OpenAI (GPT-4)';
      case 'openai7': return 'OpenAI (GPT-3.5)';
      case 'gemini': return 'Google Gemini';
      case 'anthropic': return 'Anthropic Claude';
      case 'anthropicclaude': return 'Claude 3';
      case 'groq': return 'Groq';
      case 'stabilityai': return 'StabilityAI';
      case 'replicate': return 'Replicate';
      case 'openrouter': return 'OpenRouter';
      case 'huggingface': return 'HuggingFace';
      case 'googleai': return 'Google AI';
      case 'deepseek': return 'DeepSeek';
      default: return providerId;
    }
  };

  const getProviderBadgeColor = (providerId: string) => {
    switch(providerId) {
      case 'openai': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'openai7': return 'bg-green-300/10 text-green-300 hover:bg-green-300/20';
      case 'gemini': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'anthropic': return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20';
      case 'anthropicclaude': return 'bg-purple-700/10 text-purple-700 hover:bg-purple-700/20';
      case 'groq': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'stabilityai': return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'replicate': return 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20';
      case 'openrouter': return 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20';
      case 'huggingface': return 'bg-pink-500/10 text-pink-500 hover:bg-pink-500/20';
      case 'googleai': return 'bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20';
      case 'deepseek': return 'bg-teal-500/10 text-teal-500 hover:bg-teal-500/20';
      default: return '';
    }
  };

  // Sort providers: favorites first, then by original order
  const sortedProviders = [...availableProviders].sort((a, b) => {
    const aFav = favorites.includes(a.id);
    const bFav = favorites.includes(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  const isSidebar = variant === 'sidebar';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isSidebar ? 'ghost' : 'outline'} 
          size="sm" 
          className={`${isSidebar ? 'w-full justify-between h-9' : 'h-8 gap-2 pr-3 shadow-md'}`}
        >
          <div className="flex items-center">
            <Sparkles className={`${isSidebar ? 'h-4 w-4 mr-1.5 sm:mr-2 text-sidebar-foreground' : 'h-3.5 w-3.5'}`} />
            {isSidebar ? (
              <span className="text-sidebar-foreground">{getProviderDisplayName(currentProvider)}</span>
            ) : (
              <Badge 
                variant="outline" 
                className={`px-1.5 py-0 h-5 font-medium text-xs ${getProviderBadgeColor(currentProvider)}`}
              >
                {getProviderDisplayName(currentProvider)}
              </Badge>
            )}
          </div>
          {isSidebar && (
            <Settings className="h-3.5 w-3.5 text-sidebar-foreground/70" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isSidebar ? "end" : "start"} className="w-56 z-[150]">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Settings className="h-3.5 w-3.5" />
          <span>Select AI Provider</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableProviders.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No API keys configured
          </div>
        ) : (
          sortedProviders.map((provider) => (
            <DropdownMenuItem 
              key={provider.id}
              className={`flex items-center justify-between cursor-pointer ${currentProvider === provider.id ? 'bg-accent' : ''}`}
              onClick={() => handleProviderChange(provider.id)}
            >
              <div className="flex items-center gap-2">
                <div 
                  role="button"
                  tabIndex={0}
                  className={`p-0.5 rounded-full hover:bg-muted-foreground/20 transition-colors ${favorites.includes(provider.id) ? 'text-yellow-500' : 'text-muted-foreground/30 hover:text-yellow-500/50'}`}
                  onClick={(e) => toggleFavorite(e, provider.id)}
                >
                  <Star className={`h-3.5 w-3.5 ${favorites.includes(provider.id) ? 'fill-yellow-500' : ''}`} />
                </div>
                <span>{provider.name}</span>
              </div>
              <Badge 
                variant="outline" 
                className={`text-[10px] ${getProviderBadgeColor(provider.id)}`}
              >
                {provider.id === 'openai' ? 'Best Quality' : 
                 provider.id === 'openai7' ? 'Fast' :
                 provider.id === 'gemini' ? 'Balanced' : 
                 provider.id === 'anthropic' ? 'Creative' :
                 provider.id === 'anthropicclaude' ? 'Advanced' :
                 provider.id === 'groq' ? 'Fast' :
                 provider.id === 'stabilityai' ? 'Stable' :
                 provider.id === 'replicate' ? 'Flexible' :
                 provider.id === 'openrouter' ? 'Router' :
                 provider.id === 'huggingface' ? 'Open Source' :
                 provider.id === 'googleai' ? 'Google' :
                 provider.id === 'deepseek' ? 'Deep Learning' : ''}
              </Badge>
            </DropdownMenuItem>
          ))
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
            <Settings className="h-3.5 w-3.5" />
            <span>Manage API Keys</span>
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
