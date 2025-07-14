import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Save, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getUserSettings, updateApiKey, deleteApiKey } from '@/services/userSettingsService';
import { useAIProvider } from '@/contexts/AIProviderContext';

export function ApiKeySettings() {
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const { availableProviders, setCurrentProvider } = useAIProvider();

  // Load existing API keys
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getUserSettings();
        if (settings) {
          if (settings.openai_api_key) setOpenaiKey(settings.openai_api_key);
          if (settings.gemini_api_key) setGeminiKey(settings.gemini_api_key);
          if (settings.anthropic_api_key) setAnthropicKey(settings.anthropic_api_key);
        }
      } catch (error) {
        console.error('Error loading API keys:', error);
        toast({
          title: 'Error',
          description: 'Failed to load API keys',
          variant: 'destructive',
        });
      } finally {
        setInitialLoad(false);
      }
    };

    loadSettings();
  }, []);

  const handleSaveKey = async (provider: 'openai' | 'gemini' | 'anthropic') => {
    setLoading(true);
    try {
      let key = '';
      switch (provider) {
        case 'openai':
          key = openaiKey;
          break;
        case 'gemini':
          key = geminiKey;
          break;
        case 'anthropic':
          key = anthropicKey;
          break;
      }

      if (!key.trim()) {
        toast({
          title: 'Error',
          description: 'API key cannot be empty',
          variant: 'destructive',
        });
        return;
      }

      const success = await updateApiKey(provider, key);
      if (success) {
        toast({
          title: 'Success',
          description: `${provider.charAt(0).toUpperCase() + provider.slice(1)} API key saved successfully`,
        });
        
        // Update available providers
        window.location.reload();
      } else {
        toast({
          title: 'Error',
          description: `Failed to save ${provider} API key`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error(`Error saving ${provider} API key:`, error);
      toast({
        title: 'Error',
        description: `Failed to save ${provider} API key`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (provider: 'openai' | 'gemini' | 'anthropic') => {
    if (!confirm(`Are you sure you want to delete your ${provider} API key?`)) {
      return;
    }

    setLoading(true);
    try {
      const success = await deleteApiKey(provider);
      if (success) {
        toast({
          title: 'Success',
          description: `${provider.charAt(0).toUpperCase() + provider.slice(1)} API key deleted successfully`,
        });

        // Clear the input field
        switch (provider) {
          case 'openai':
            setOpenaiKey('');
            break;
          case 'gemini':
            setGeminiKey('');
            break;
          case 'anthropic':
            setAnthropicKey('');
            break;
        }
        
        // Update available providers
        window.location.reload();
      } else {
        toast({
          title: 'Error',
          description: `Failed to delete ${provider} API key`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error(`Error deleting ${provider} API key:`, error);
      toast({
        title: 'Error',
        description: `Failed to delete ${provider} API key`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return <div className="p-4 text-center">Loading API key settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Key Settings</CardTitle>
        <CardDescription>
          Add your AI provider API keys to enable AI features in the dashboard.
          Your keys are securely stored in your user account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="openai" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="openai">OpenAI</TabsTrigger>
            <TabsTrigger value="gemini">Gemini</TabsTrigger>
            <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
          </TabsList>
          
          <TabsContent value="openai" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <div className="flex">
                <Input
                  id="openai-key"
                  type={showOpenaiKey ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  className="ml-2"
                >
                  {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Get your API key from the <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI dashboard</a>.
              </p>
            </div>
            <div className="flex justify-between mt-4">
              <Button
                variant="default"
                onClick={() => handleSaveKey('openai')}
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Key
              </Button>
              {openaiKey && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteKey('openai')}
                  disabled={loading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Key
                </Button>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="gemini" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="gemini-key">Gemini API Key</Label>
              <div className="flex">
                <Input
                  id="gemini-key"
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="ml-2"
                >
                  {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Get your API key from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>.
              </p>
            </div>
            <div className="flex justify-between mt-4">
              <Button
                variant="default"
                onClick={() => handleSaveKey('gemini')}
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Key
              </Button>
              {geminiKey && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteKey('gemini')}
                  disabled={loading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Key
                </Button>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="anthropic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="anthropic-key">Anthropic API Key</Label>
              <div className="flex">
                <Input
                  id="anthropic-key"
                  type={showAnthropicKey ? 'text' : 'password'}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                  className="ml-2"
                >
                  {showAnthropicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Get your API key from the <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Anthropic Console</a>.
              </p>
            </div>
            <div className="flex justify-between mt-4">
              <Button
                variant="default"
                onClick={() => handleSaveKey('anthropic')}
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Key
              </Button>
              {anthropicKey && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteKey('anthropic')}
                  disabled={loading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Key
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Your API keys are stored securely in your user account and are never shared.
        </div>
      </CardFooter>
    </Card>
  );
}