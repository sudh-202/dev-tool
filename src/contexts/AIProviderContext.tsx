import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AIProvider, getAvailableAIProviders, getDefaultProvider } from '@/services/aiService';

interface AIProviderContextType {
  currentProvider: AIProvider;
  setCurrentProvider: (provider: AIProvider) => void;
  availableProviders: { id: AIProvider; name: string }[];
}

const AIProviderContext = createContext<AIProviderContextType | undefined>(undefined);

export function AIProviderProvider({ children }: { children: ReactNode }) {
  // Default to 'gemini' initially, will be updated after async calls complete
  const [currentProvider, setCurrentProvider] = useState<AIProvider>('gemini');
  const [availableProviders, setAvailableProviders] = useState<{ id: AIProvider; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Load API providers and default provider on component mount
  useEffect(() => {
    const initializeProviders = async () => {
      try {
        setLoading(true);
        // Get available providers
        const providers = await getAvailableAIProviders();
        setAvailableProviders(providers);
        
        // Get default provider
        const defaultProvider = await getDefaultProvider();
        setCurrentProvider(defaultProvider);
      } catch (error) {
        console.error('Error initializing AI providers:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeProviders();
  }, []);

  return (
    <AIProviderContext.Provider
      value={{
        currentProvider,
        setCurrentProvider,
        availableProviders,
      }}
    >
      {loading ? <div>Loading AI providers...</div> : children}
    </AIProviderContext.Provider>
  );
}

export function useAIProvider() {
  const context = useContext(AIProviderContext);
  if (context === undefined) {
    throw new Error('useAIProvider must be used within an AIProviderProvider');
  }
  return context;
}