import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Save, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getUserSettings, updateApiKey, deleteApiKey } from '@/services/userSettingsService';
import { useAIProvider } from '@/contexts/AIProviderContext';
import { AIProvider } from '@/services/aiService';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ApiKeySettings() {
  const [openaiKey, setOpenaiKey] = useState('');
  const [openai7Key, setOpenai7Key] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [anthropicclaudeKey, setAnthropicclaudeKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [stabilityaiKey, setStabilityaiKey] = useState('');
  const [replicateKey, setReplicateKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [huggingfaceKey, setHuggingfaceKey] = useState('');
  const [googleaiKey, setGoogleaiKey] = useState('');
  const [deepseekKey, setDeepseekKey] = useState('');
  
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showOpenai7Key, setShowOpenai7Key] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showAnthropicclaudeKey, setShowAnthropicclaudeKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showStabilityaiKey, setShowStabilityaiKey] = useState(false);
  const [showReplicateKey, setShowReplicateKey] = useState(false);
  const [showOpenrouterKey, setShowOpenrouterKey] = useState(false);
  const [showHuggingfaceKey, setShowHuggingfaceKey] = useState(false);
  const [showGoogleaiKey, setShowGoogleaiKey] = useState(false);
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const { availableProviders, setCurrentProvider } = useAIProvider();

  // Load existing API keys
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getUserSettings();
        if (settings) {
          if (settings.openai_api_key) setOpenaiKey(settings.openai_api_key);
          if (settings.openai7_api_key) setOpenai7Key(settings.openai7_api_key);
          if (settings.gemini_api_key) setGeminiKey(settings.gemini_api_key);
          if (settings.anthropic_api_key) setAnthropicKey(settings.anthropic_api_key);
          if (settings.anthropicclaude_api_key) setAnthropicclaudeKey(settings.anthropicclaude_api_key);
          if (settings.groq_api_key) setGroqKey(settings.groq_api_key);
          if (settings.stabilityai_api_key) setStabilityaiKey(settings.stabilityai_api_key);
          if (settings.replicate_api_key) setReplicateKey(settings.replicate_api_key);
          if (settings.openrouter_api_key) setOpenrouterKey(settings.openrouter_api_key);
          if (settings.huggingface_api_key) setHuggingfaceKey(settings.huggingface_api_key);
          if (settings.googleai_api_key) setGoogleaiKey(settings.googleai_api_key);
          if (settings.deepseek_api_key) setDeepseekKey(settings.deepseek_api_key);
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

  const handleSaveKey = async (provider: AIProvider) => {
    setLoading(true);
    try {
      let key = '';
      switch (provider) {
        case 'openai':
          key = openaiKey;
          break;
        case 'openai7':
          key = openai7Key;
          break;
        case 'gemini':
          key = geminiKey;
          break;
        case 'anthropic':
          key = anthropicKey;
          break;
        case 'anthropicclaude':
          key = anthropicclaudeKey;
          break;
        case 'groq':
          key = groqKey;
          break;
        case 'stabilityai':
          key = stabilityaiKey;
          break;
        case 'replicate':
          key = replicateKey;
          break;
        case 'openrouter':
          key = openrouterKey;
          break;
        case 'huggingface':
          key = huggingfaceKey;
          break;
        case 'googleai':
          key = googleaiKey;
          break;
        case 'deepseek':
          key = deepseekKey;
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

  const handleDeleteKey = async (provider: AIProvider) => {
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
          case 'openai7':
            setOpenai7Key('');
            break;
          case 'gemini':
            setGeminiKey('');
            break;
          case 'anthropic':
            setAnthropicKey('');
            break;
          case 'anthropicclaude':
            setAnthropicclaudeKey('');
            break;
          case 'groq':
            setGroqKey('');
            break;
          case 'stabilityai':
            setStabilityaiKey('');
            break;
          case 'replicate':
            setReplicateKey('');
            break;
          case 'openrouter':
            setOpenrouterKey('');
            break;
          case 'huggingface':
            setHuggingfaceKey('');
            break;
          case 'googleai':
            setGoogleaiKey('');
            break;
          case 'deepseek':
            setDeepseekKey('');
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
        <div className="mb-6">
          <Label htmlFor="provider-select" className="mb-2 block">Select AI Provider</Label>
          <Select value={selectedProvider} onValueChange={(value) => setSelectedProvider(value as AIProvider)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an AI provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>OpenAI</SelectLabel>
                <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                <SelectItem value="openai7">OpenAI GPT-3.5</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Anthropic</SelectLabel>
                <SelectItem value="anthropic">Claude</SelectItem>
                <SelectItem value="anthropicclaude">Claude 3</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Google</SelectLabel>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="googleai">Google AI</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Other Providers</SelectLabel>
                <SelectItem value="groq">Groq</SelectItem>
                <SelectItem value="stabilityai">StabilityAI</SelectItem>
                <SelectItem value="replicate">Replicate</SelectItem>
                <SelectItem value="openrouter">OpenRouter</SelectItem>
                <SelectItem value="huggingface">HuggingFace</SelectItem>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        {selectedProvider === 'openai' && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI GPT-4 API Key</Label>
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
          </div>
        )}
        
        {selectedProvider === 'openai7' && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="openai7-key">OpenAI GPT-3.5 API Key</Label>
              <div className="flex">
                <Input
                  id="openai7-key"
                  type={showOpenai7Key ? 'text' : 'password'}
                  value={openai7Key}
                  onChange={(e) => setOpenai7Key(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => setShowOpenai7Key(!showOpenai7Key)}
                  className="ml-2"
                >
                  {showOpenai7Key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Get your API key from the <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI dashboard</a>.
              </p>
            </div>
            <div className="flex justify-between mt-4">
              <Button
                variant="default"
                onClick={() => handleSaveKey('openai7')}
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Key
              </Button>
              {openai7Key && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteKey('openai7')}
                  disabled={loading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Key
                </Button>
              )}
            </div>
          </div>
        )}
        
        {selectedProvider === 'gemini' && (
          <div className="space-y-4 mt-4">
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
          </div>
        )}
          
        {selectedProvider === 'anthropicclaude' && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="anthropicclaude-key">Claude 3 API Key</Label>
              <div className="flex">
                <Input
                  id="anthropicclaude-key"
                  type={showAnthropicclaudeKey ? 'text' : 'password'}
                  value={anthropicclaudeKey}
                  onChange={(e) => setAnthropicclaudeKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => setShowAnthropicclaudeKey(!showAnthropicclaudeKey)}
                  className="ml-2"
                >
                  {showAnthropicclaudeKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Get your API key from the <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Anthropic Console</a>.
              </p>
            </div>
            <div className="flex justify-between mt-4">
              <Button
                variant="default"
                onClick={() => handleSaveKey('anthropicclaude')}
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Key
              </Button>
              {anthropicclaudeKey && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteKey('anthropicclaude')}
                  disabled={loading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Key
                </Button>
              )}
            </div>
          </div>
        )}
        
        {selectedProvider === 'groq' && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="groq-key">Groq API Key</Label>
              <div className="flex">
                <Input
                  id="groq-key"
                  type={showGroqKey ? 'text' : 'password'}
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  className="ml-2"
                >
                  {showGroqKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Get your API key from the <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Groq Console</a>.
              </p>
            </div>
            <div className="flex justify-between mt-4">
              <Button
                variant="default"
                onClick={() => handleSaveKey('groq')}
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Key
              </Button>
              {groqKey && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteKey('groq')}
                  disabled={loading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Key
                </Button>
              )}
            </div>
          </div>
        )}
        
        {selectedProvider === 'stabilityai' && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="stabilityai-key">StabilityAI API Key</Label>
              <div className="flex">
                <Input
                  id="stabilityai-key"
                  type={showStabilityaiKey ? 'text' : 'password'}
                  value={stabilityaiKey}
                  onChange={(e) => setStabilityaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1"
                />
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={() => setShowStabilityaiKey(!showStabilityaiKey)}
                    className="ml-2"
                  >
                    {showStabilityaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get your API key from the <a href="https://platform.stability.ai/account/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">StabilityAI dashboard</a>.
                </p>
              </div>
              <div className="flex justify-between mt-4">
                <Button
                  variant="default"
                  onClick={() => handleSaveKey('stabilityai')}
                  disabled={loading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Key
                </Button>
                {stabilityaiKey && (
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteKey('stabilityai')}
                    disabled={loading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Key
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {selectedProvider === 'replicate' && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="replicate-key">Replicate API Key</Label>
                <div className="flex">
                  <Input
                    id="replicate-key"
                    type={showReplicateKey ? 'text' : 'password'}
                    value={replicateKey}
                    onChange={(e) => setReplicateKey(e.target.value)}
                    placeholder="r8_..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={() => setShowReplicateKey(!showReplicateKey)}
                    className="ml-2"
                  >
                    {showReplicateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get your API key from the <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Replicate dashboard</a>.
                </p>
              </div>
              <div className="flex justify-between mt-4">
                <Button
                  variant="default"
                  onClick={() => handleSaveKey('replicate')}
                  disabled={loading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Key
                </Button>
                {replicateKey && (
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteKey('replicate')}
                    disabled={loading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Key
                  </Button>
                )}
              </div>
            </div>
          )}
        
        {selectedProvider === 'openrouter' && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="openrouter-key">OpenRouter API Key</Label>
              <div className="flex">
                <Input
                  id="openrouter-key"
                  type={showOpenrouterKey ? 'text' : 'password'}
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  placeholder="sk-or-..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => setShowOpenrouterKey(!showOpenrouterKey)}
                  className="ml-2"
                >
                  {showOpenrouterKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Get your API key from the <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenRouter dashboard</a>.
              </p>
            </div>
            <div className="flex justify-between mt-4">
              <Button
                variant="default"
                onClick={() => handleSaveKey('openrouter')}
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Key
              </Button>
              {openrouterKey && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteKey('openrouter')}
                  disabled={loading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Key
                </Button>
              )}
            </div>
          </div>
        )}
        
        {selectedProvider === 'huggingface' && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="huggingface-key">HuggingFace API Key</Label>
              <div className="flex">
                <Input
                  id="huggingface-key"
                  type={showHuggingfaceKey ? 'text' : 'password'}
                  value={huggingfaceKey}
                  onChange={(e) => setHuggingfaceKey(e.target.value)}
                  placeholder="hf_..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => setShowHuggingfaceKey(!showHuggingfaceKey)}
                  className="ml-2"
                >
                  {showHuggingfaceKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Get your API key from the <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">HuggingFace dashboard</a>.
              </p>
            </div>
            <div className="flex justify-between mt-4">
              <Button
                variant="default"
                onClick={() => handleSaveKey('huggingface')}
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Key
              </Button>
              {huggingfaceKey && (
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteKey('huggingface')}
                    disabled={loading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Key
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {selectedProvider === 'googleai' && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="googleai-key">Google AI API Key</Label>
                <div className="flex">
                  <Input
                    id="googleai-key"
                    type={showGoogleaiKey ? 'text' : 'password'}
                    value={googleaiKey}
                    onChange={(e) => setGoogleaiKey(e.target.value)}
                    placeholder="AIza..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={() => setShowGoogleaiKey(!showGoogleaiKey)}
                    className="ml-2"
                  >
                    {showGoogleaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get your API key from the <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>.
                </p>
              </div>
              <div className="flex justify-between mt-4">
                <Button
                  variant="default"
                  onClick={() => handleSaveKey('googleai')}
                  disabled={loading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Key
                </Button>
                {googleaiKey && (
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteKey('googleai')}
                    disabled={loading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Key
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {selectedProvider === 'deepseek' && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="deepseek-key">DeepSeek API Key</Label>
                <div className="flex">
                  <Input
                    id="deepseek-key"
                    type={showDeepseekKey ? 'text' : 'password'}
                    value={deepseekKey}
                    onChange={(e) => setDeepseekKey(e.target.value)}
                    placeholder="sk-..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                    className="ml-2"
                  >
                    {showDeepseekKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get your API key from the <a href="https://platform.deepseek.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">DeepSeek dashboard</a>.
                </p>
              </div>
              <div className="flex justify-between mt-4">
                <Button
                  variant="default"
                  onClick={() => handleSaveKey('deepseek')}
                  disabled={loading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Key
                </Button>
                {deepseekKey && (
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteKey('deepseek')}
                    disabled={loading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Key
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Your API keys are stored securely in your user account and are never shared.
        </div>
      </CardFooter>
    </Card>
  );
}