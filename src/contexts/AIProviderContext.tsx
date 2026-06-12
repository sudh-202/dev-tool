import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AIProvider, getAvailableAIProviders, getDefaultProvider, loadApiKeys } from '@/services/aiService';

interface AIProviderContextType {
  currentProvider: AIProvider;
  setCurrentProvider: (provider: AIProvider) => void;
  availableProviders: { id: AIProvider; name: string }[];
  refreshProviders: () => Promise<void>;
}

const AIProviderContext = createContext<AIProviderContextType | undefined>(undefined);

export function AIProviderProvider({ children }: { children: ReactNode }) {
  // Default to 'gemini' initially, will be updated after async calls complete
  const [currentProvider, setCurrentProvider] = useState<AIProvider>('gemini');
  const [availableProviders, setAvailableProviders] = useState<{ id: AIProvider; name: string }[]>([]);

  const initializeProviders = useCallback(async () => {
    try {
      // Ensure latest keys are loaded from storage first
      await loadApiKeys();
      // Get available providers
      const providers = await getAvailableAIProviders();
      setAvailableProviders(providers);

      // Set default provider if available
      if (providers.length > 0) {
        const defaultProvider = await getDefaultProvider();
        setCurrentProvider(defaultProvider);
      }
    } catch (error) {
      console.error('Error initializing AI providers:', error);
    }
  }, []);

  // Load API providers and default provider on component mount
  useEffect(() => {
    initializeProviders();
  }, [initializeProviders]);

  return (
    <AIProviderContext.Provider
      value={{
        currentProvider,
        setCurrentProvider,
        availableProviders,
        refreshProviders: initializeProviders,
      }}
    >
      {children}
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