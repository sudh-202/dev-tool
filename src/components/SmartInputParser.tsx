
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Wand2 } from 'lucide-react';

export type ParsedTool = {
  name: string;
  url: string;
  description: string;
  tags: string[];
  email?: string;
}

interface SmartInputParserProps {
  onParsed: (tool: ParsedTool) => void;
}

export function SmartInputParser({ onParsed }: SmartInputParserProps) {
  const [input, setInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const parseSmartInput = async () => {
    if (!input.trim()) return;

    setIsParsing(true);
    
    try {
      // Smart parsing logic
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = input.match(urlRegex) || [];
      const mainUrl = urls[0] || '';

      // Extract potential name (first word or domain)
      let name = '';
      if (mainUrl) {
        try {
          const domain = new URL(mainUrl).hostname.replace('www.', '');
          name = domain.split('.')[0];
          name = name.charAt(0).toUpperCase() + name.slice(1);
        } catch (e) {
          name = input.split(' ')[0];
        }
      } else {
        name = input.split(' ')[0];
      }

      // Extract tags (words that look like tags)
      const tagWords = input.toLowerCase().match(/\b(ai|api|dev|design|productivity|docs|planning|frontend|backend|database|deployment|monitoring|analytics|testing|ci\/cd|cloud|docker|kubernetes|react|vue|angular|nodejs|python|javascript|typescript)\b/g) || [];
      const uniqueTags = [...new Set(tagWords)];

      // Extract description (everything minus URL and potential name)
      let description = input.replace(urlRegex, '').replace(name, '').trim();
      if (description.startsWith(':')) description = description.slice(1).trim();

      const parsed: ParsedTool = {
        name: name || 'New Tool',
        url: mainUrl,
        description: description || '',
        tags: uniqueTags,
      };

      onParsed(parsed);
    } catch (error) {
      console.error('Failed to parse input:', error);
    } finally {
      setIsParsing(false);
      setInput('');
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="smart-input">Smart Input</Label>
      <div className="flex gap-2">
        <Textarea
          id="smart-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Try: 'Add Notion: https://notion.so for docs and planning, great for productivity and team collaboration'"
          className="flex-1"
          rows={2}
        />
        <Button
          onClick={parseSmartInput}
          disabled={!input.trim() || isParsing}
          className="self-end"
        >
          <Wand2 className="h-4 w-4 mr-1" />
          {isParsing ? 'Parsing...' : 'Parse'}
        </Button>
      </div>
    </div>
  );
}
