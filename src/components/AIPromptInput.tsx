import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { generateToolsFromPrompt } from '@/services/aiService';
import { Tool } from '@/types';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIPromptInputProps {
  onToolsGenerated: (tools: Omit<Tool, 'id' | 'createdAt' | 'updatedAt' | 'isPinned'>[]) => void;
  onClose: () => void;
}

export function AIPromptInput({ onToolsGenerated, onClose }: AIPromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toolCount, setToolCount] = useState(5);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError('');
    
    try {
      console.log(`Generating tools with prompt: "${prompt}" and count: ${toolCount}`);
      
      // API keys are now loaded from user settings in the database
      
      const aiResponse = await generateToolsFromPrompt(prompt, toolCount);
      console.log('AI response received:', aiResponse);
      
      if (!aiResponse || !aiResponse.tools || aiResponse.tools.length === 0) {
        throw new Error('No tools were generated. Please try a different prompt.');
      }
      
      const tools = aiResponse.tools.map(tool => ({
        name: tool.name,
        url: tool.url,
        description: tool.description,
        category: tool.category,
        tags: tool.tags,
        isPinned: false
      }));

      toast({
        title: 'Tools generated',
        description: `Generated ${tools.length} tools successfully`,
      });

      onToolsGenerated(tools);
      onClose();
    } catch (error) {
      console.error('Failed to generate tools:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate tools. Please try again.');
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate tools. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const suggestions = [
    "Create a dashboard for AI research tools",
    "Frontend development essentials",
    "DevOps and deployment tools",
    "Design and UI/UX resources",
    "Data science and analytics platforms"
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI-Powered Dashboard Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="text-sm py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Input
            placeholder="Describe the type of tools you need (e.g., 'productivity tools for remote work')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
            className="text-base"
            disabled={isGenerating}
          />
          
          <div className="space-y-2 pt-2 pb-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="tool-count">Number of tools to generate:</Label>
              <div className="bg-primary/10 text-primary font-medium rounded-full w-8 h-8 flex items-center justify-center">
                {toolCount}
              </div>
            </div>
            <Slider
              id="tool-count"
              min={1}
              max={10}
              step={1}
              value={[toolCount]}
              onValueChange={(value) => setToolCount(value[0])}
              className="py-2"
              disabled={isGenerating}
            />
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerate} 
              disabled={!prompt.trim() || isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isGenerating ? 'Generating...' : `Generate ${toolCount} Tools`}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isGenerating}>
              Cancel
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Try these suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setPrompt(suggestion)}
                className="text-xs h-8"
                disabled={isGenerating}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
