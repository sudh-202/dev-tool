import { createContext, useContext, useState, ReactNode } from 'react';
import { AIProvider, getAvailableAIProviders, getDefaultProvider } from '@/services/aiService';

interface AIProviderContextType {
  currentProvider: AIProvider;
  setCurrentProvider: (provider: AIProvider) => void;
  availableProviders: { id: AIProvider; name: string }[];
}

const AIProviderContext = createContext<AIProviderContextType | undefined>(undefined);

export function AIProviderProvider({ children }: { children: ReactNode }) {
  const [currentProvider, setCurrentProvider] = useState<AIProvider>(getDefaultProvider());
  const availableProviders = getAvailableAIProviders();

  return (
    <AIProviderContext.Provider
      value={{
        currentProvider,
        setCurrentProvider,
        availableProviders,
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