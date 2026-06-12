import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getUserSettings, updateApiKey, deleteApiKey } from '@/services/userSettingsService';
import { useAIProvider } from '@/contexts/AIProviderContext';
import { AIProvider } from '@/services/aiService';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';

// ── Provider catalogue ────────────────────────────────────────────────────────
interface ProviderMeta {
  id: AIProvider;
  label: string;
  group: string;
  placeholder: string;
  docsUrl: string;
  docsLabel: string;
  settingsKey: keyof SavedKeys;
}

type SavedKeys = {
  openai: string;
  openai7: string;
  gemini: string;
  anthropic: string;
  anthropicclaude: string;
  groq: string;
  stabilityai: string;
  replicate: string;
  openrouter: string;
  huggingface: string;
  deepseek: string;
};

const ALL_PROVIDERS: ProviderMeta[] = [
  // Google / Gemini  (single entry — "Google AI" & "Gemini" share the same API)
  {
    id: 'gemini',
    label: 'Google Gemini',
    group: 'Google',
    placeholder: 'AIzaSy… or AQ.Ab…',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    docsLabel: 'Google AI Studio',
    settingsKey: 'gemini',
  },
  // OpenAI
  {
    id: 'openai',
    label: 'OpenAI GPT-4',
    group: 'OpenAI',
    placeholder: 'sk-…',
    docsUrl: 'https://platform.openai.com/api-keys',
    docsLabel: 'OpenAI dashboard',
    settingsKey: 'openai',
  },
  {
    id: 'openai7',
    label: 'OpenAI GPT-3.5',
    group: 'OpenAI',
    placeholder: 'sk-…',
    docsUrl: 'https://platform.openai.com/api-keys',
    docsLabel: 'OpenAI dashboard',
    settingsKey: 'openai7',
  },
  // Anthropic
  {
    id: 'anthropic',
    label: 'Claude (Anthropic)',
    group: 'Anthropic',
    placeholder: 'sk-ant-…',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    docsLabel: 'Anthropic Console',
    settingsKey: 'anthropic',
  },
  {
    id: 'anthropicclaude',
    label: 'Claude 3',
    group: 'Anthropic',
    placeholder: 'sk-ant-…',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    docsLabel: 'Anthropic Console',
    settingsKey: 'anthropicclaude',
  },
  // Others
  {
    id: 'groq',
    label: 'Groq',
    group: 'Other Providers',
    placeholder: 'gsk_…',
    docsUrl: 'https://console.groq.com/keys',
    docsLabel: 'Groq Console',
    settingsKey: 'groq',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    group: 'Other Providers',
    placeholder: 'sk-or-…',
    docsUrl: 'https://openrouter.ai/keys',
    docsLabel: 'OpenRouter dashboard',
    settingsKey: 'openrouter',
  },
  {
    id: 'replicate',
    label: 'Replicate',
    group: 'Other Providers',
    placeholder: 'r8_…',
    docsUrl: 'https://replicate.com/account/api-tokens',
    docsLabel: 'Replicate dashboard',
    settingsKey: 'replicate',
  },
  {
    id: 'stabilityai',
    label: 'StabilityAI',
    group: 'Other Providers',
    placeholder: 'sk-…',
    docsUrl: 'https://platform.stability.ai/account/keys',
    docsLabel: 'StabilityAI dashboard',
    settingsKey: 'stabilityai',
  },
  {
    id: 'huggingface',
    label: 'HuggingFace',
    group: 'Other Providers',
    placeholder: 'hf_…',
    docsUrl: 'https://huggingface.co/settings/tokens',
    docsLabel: 'HuggingFace dashboard',
    settingsKey: 'huggingface',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    group: 'Other Providers',
    placeholder: 'sk-…',
    docsUrl: 'https://platform.deepseek.com/',
    docsLabel: 'DeepSeek platform',
    settingsKey: 'deepseek',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function ApiKeySettings() {
  const [keys, setKeys] = useState<SavedKeys>({
    openai: '', openai7: '', gemini: '',
    anthropic: '', anthropicclaude: '', groq: '',
    stabilityai: '', replicate: '', openrouter: '',
    huggingface: '', deepseek: '',
  });

  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('gemini');

  const { refreshProviders } = useAIProvider();

  // ── Load saved keys ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const settings = await getUserSettings();
        if (settings) {
          const next: SavedKeys = { ...keys };
          if (settings.openai_api_key)         next.openai        = settings.openai_api_key;
          if (settings.openai7_api_key)        next.openai7       = settings.openai7_api_key;
          if (settings.gemini_api_key)         next.gemini        = settings.gemini_api_key;
          if (settings.anthropic_api_key)      next.anthropic     = settings.anthropic_api_key;
          if (settings.anthropicclaude_api_key) next.anthropicclaude = settings.anthropicclaude_api_key;
          if (settings.groq_api_key)           next.groq          = settings.groq_api_key;
          if (settings.stabilityai_api_key)    next.stabilityai   = settings.stabilityai_api_key;
          if (settings.replicate_api_key)      next.replicate     = settings.replicate_api_key;
          if (settings.openrouter_api_key)     next.openrouter    = settings.openrouter_api_key;
          if (settings.huggingface_api_key)    next.huggingface   = settings.huggingface_api_key;
          if (settings.deepseek_api_key)       next.deepseek      = settings.deepseek_api_key;
          setKeys(next);

          // Auto-select the first provider that already has a key saved
          const firstConfigured = ALL_PROVIDERS.find(p => !!next[p.settingsKey]);
          if (firstConfigured) setSelectedProvider(firstConfigured.id);
        }
      } catch (err) {
        console.error('Error loading API keys:', err);
        toast({ title: 'Error', description: 'Failed to load API keys', variant: 'destructive' });
      } finally {
        setInitialLoad(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sorted providers: configured ones float to top ───────────────────────
  const sortedProviders = useMemo(() => {
    const configured = ALL_PROVIDERS.filter(p => !!keys[p.settingsKey]);
    const unconfigured = ALL_PROVIDERS.filter(p => !keys[p.settingsKey]);
    return { configured, unconfigured };
  }, [keys]);

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async (provider: AIProvider) => {
    const meta = ALL_PROVIDERS.find(p => p.id === provider)!;
    const key = keys[meta.settingsKey];

    if (!key.trim()) {
      toast({ title: 'Error', description: 'API key cannot be empty', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const success = await updateApiKey(provider, key.trim());
      if (success) {
        toast({ title: 'Success', description: `${meta.label} API key saved` });
        await refreshProviders();
      } else {
        toast({ title: 'Error', description: `Failed to save ${meta.label} API key`, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: `Failed to save ${meta.label} API key`, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (provider: AIProvider) => {
    const meta = ALL_PROVIDERS.find(p => p.id === provider)!;
    if (!confirm(`Delete your ${meta.label} API key?`)) return;

    setLoading(true);
    try {
      const success = await deleteApiKey(provider);
      if (success) {
        setKeys(prev => ({ ...prev, [meta.settingsKey]: '' }));
        toast({ title: 'Success', description: `${meta.label} API key deleted` });
        await refreshProviders();
      } else {
        toast({ title: 'Error', description: `Failed to delete ${meta.label} API key`, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: `Failed to delete ${meta.label} API key`, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return <div className="p-4 text-center text-muted-foreground">Loading API key settings…</div>;
  }

  const currentMeta = ALL_PROVIDERS.find(p => p.id === selectedProvider)!;
  const currentKey = keys[currentMeta.settingsKey];
  const hasKey = !!currentKey;

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Key Settings</CardTitle>
        <CardDescription>
          Add your AI provider API keys to enable AI-powered search. Keys are stored
          locally in your browser and never sent to any server.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* ── Provider selector ── */}
        <div className="space-y-2">
          <Label htmlFor="provider-select">Select AI Provider</Label>
          <Select value={selectedProvider} onValueChange={v => setSelectedProvider(v as AIProvider)}>
            <SelectTrigger className="w-full" id="provider-select">
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>

              {/* Configured providers float to top */}
              {sortedProviders.configured.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-1.5 text-emerald-500">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Configured
                  </SelectLabel>
                  {sortedProviders.configured.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}

              {sortedProviders.configured.length > 0 && sortedProviders.unconfigured.length > 0 && (
                <SelectSeparator />
              )}

              {/* Unconfigured providers, grouped */}
              {(['Google', 'OpenAI', 'Anthropic', 'Other Providers'] as const).map(group => {
                const groupItems = sortedProviders.unconfigured.filter(p => p.group === group);
                if (groupItems.length === 0) return null;
                return (
                  <SelectGroup key={group}>
                    <SelectLabel>{group}</SelectLabel>
                    {groupItems.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectGroup>
                );
              })}

            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Providers with a ✓ already have a key saved and are ready to use.
          </p>
        </div>

        {/* ── Key input for selected provider ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="api-key-input">{currentMeta.label} API Key</Label>
            {hasKey && (
              <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Key saved
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              id="api-key-input"
              type={showKey[selectedProvider] ? 'text' : 'password'}
              value={currentKey}
              onChange={e => setKeys(prev => ({ ...prev, [currentMeta.settingsKey]: e.target.value }))}
              placeholder={currentMeta.placeholder}
              className="flex-1 font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => setShowKey(prev => ({ ...prev, [selectedProvider]: !prev[selectedProvider] }))}
              aria-label={showKey[selectedProvider] ? 'Hide key' : 'Show key'}
            >
              {showKey[selectedProvider] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Get your API key from the{' '}
            <a
              href={currentMeta.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {currentMeta.docsLabel}
            </a>
            .
            {currentMeta.id === 'gemini' && (
              <span className="block mt-1 text-xs">
                Both <code className="bg-muted px-1 rounded">AIzaSy…</code> and the newer{' '}
                <code className="bg-muted px-1 rounded">AQ.Ab…</code> key formats are supported.
              </span>
            )}
          </p>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center justify-between pt-1">
          <Button
            variant="default"
            onClick={() => handleSave(selectedProvider)}
            disabled={loading || !currentKey.trim()}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Key
          </Button>

          {hasKey && (
            <Button
              variant="destructive"
              onClick={() => handleDelete(selectedProvider)}
              disabled={loading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Key
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground border-t pt-4">
          Your API keys are stored locally in your browser (localStorage) and are never
          transmitted to or stored on any server.
        </p>
      </CardContent>
    </Card>
  );
}