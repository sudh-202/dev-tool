import { useState } from 'react';
import { useAIProvider } from '@/contexts/AIProviderContext';
import { Button } from '@/components/ui/button';
import { Settings, Sparkles, ExternalLink } from 'lucide-react';
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

interface AIModelSelectorProps {
  variant?: 'default' | 'sidebar';
}

export function AIModelSelector({ variant = 'default' }: AIModelSelectorProps) {
  const { currentProvider, setCurrentProvider, availableProviders } = useAIProvider();
  
  const handleProviderChange = (providerId: string) => {
    setCurrentProvider(providerId as any);
    toast({
      title: 'AI Provider Changed',
      description: `Now using ${getProviderDisplayName(providerId)} for AI operations`,
    });
  };
  
  const getProviderDisplayName = (providerId: string) => {
    switch(providerId) {
      case 'openai': return 'OpenAI (GPT-4)';
      case 'gemini': return 'Google Gemini';
      case 'anthropic': return 'Anthropic Claude';
      default: return providerId;
    }
  };

  const getProviderBadgeColor = (providerId: string) => {
    switch(providerId) {
      case 'openai': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'gemini': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'anthropic': return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20';
      default: return '';
    }
  };

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
          availableProviders.map((provider) => (
            <DropdownMenuItem 
              key={provider.id}
              className={`flex items-center justify-between ${currentProvider === provider.id ? 'bg-accent' : ''}`}
              onClick={() => handleProviderChange(provider.id)}
            >
              <span>{provider.name}</span>
              <Badge 
                variant="outline" 
                className={`text-[10px] ${getProviderBadgeColor(provider.id)}`}
              >
                {provider.id === 'openai' ? 'Best Quality' : 
                 provider.id === 'gemini' ? 'Balanced' : 
                 provider.id === 'anthropic' ? 'Creative' : ''}
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