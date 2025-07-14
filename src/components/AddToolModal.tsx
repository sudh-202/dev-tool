import { useState, useEffect } from 'react';
import { Tool } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X, Eye, EyeOff, Copy, AlertCircle, Settings } from 'lucide-react';
import { 
  categorizeAndTagTool, 
  generateFieldContent, 
  getAvailableAIProviders, 
  getDefaultProvider,
  type AIProvider
} from '@/services/aiService';
import { toast } from '@/hooks/use-toast';
import { SmartInputParser } from './SmartInputParser';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { useAIProvider } from '@/contexts/AIProviderContext';

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tool: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>) => void;
  categories: string[];
  editingTool?: Tool | null;
}

export function AddToolModal({ isOpen, onClose, onSave, categories, editingTool }: AddToolModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    category: '',
    categories: [] as string[],
    tags: [] as string[],
    isPinned: false,
    isFavorite: false,
    email: '',
    apiKey: '',
    notes: '',

  });
  const [tagInput, setTagInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [processingField, setProcessingField] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // Use global AI provider context instead of local state
  const { currentProvider } = useAIProvider();

  useEffect(() => {
    if (editingTool) {
      setFormData({
        name: editingTool.name,
        url: editingTool.url,
        description: editingTool.description || '',
        category: editingTool.category || '',
        categories: editingTool.categories || (editingTool.category ? [editingTool.category] : []),
        tags: [...editingTool.tags],
        isPinned: editingTool.isPinned,
        isFavorite: editingTool.isFavorite || false,
        email: editingTool.email || '',
        apiKey: editingTool.apiKey || '',
        notes: editingTool.notes || '',

      });
      
      // If category is not in default list, it's a custom category
      if (editingTool.category && !categories.includes(editingTool.category)) {
        setCustomCategory(editingTool.category);
      } else {
        setCustomCategory('');
      }
    } else {
      setFormData({
        name: '',
        url: '',
        description: '',
        category: '',
        categories: [],
        tags: [],
        isPinned: false,
        isFavorite: false,
        email: '',
        apiKey: '',
        notes: '',

      });
      setCustomCategory('');
    }
    setTagInput('');
    setCategoryInput('');
    setShowApiKey(false);
    setErrors({});
    setFormSubmitted(false);
  }, [editingTool, isOpen, categories]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Tool name is required';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else if (!/^https?:\/\/.+/.test(formData.url)) {
      newErrors.url = 'Please enter a valid URL (including http:// or https://)';
    }
    
    if (formData.categories.length === 0) {
      newErrors.categories = 'At least one category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSmartParse = (parsed: any) => {
    setFormData(prev => ({
      ...prev,
      name: parsed.name || prev.name,
      url: parsed.url || prev.url,
      description: parsed.description || prev.description,
      tags: [...new Set([...prev.tags, ...parsed.tags])],
      email: parsed.email || prev.email,
    }));
    
    toast({
      title: "Smart Parse Complete",
      description: "Tool information has been auto-filled from your input.",
    });
  };

  const handleAIEnhance = async () => {
    if (!formData.name || !formData.url) {
      setErrors(prev => ({
        ...prev,
        name: !formData.name ? 'Tool name is required for AI enhancement' : '',
        url: !formData.url ? 'URL is required for AI enhancement' : ''
      }));
      return;
    }

    setIsAIProcessing(true);
    setProcessingField('all');
    try {
      const aiSuggestion = await categorizeAndTagTool(
        formData.name, 
        formData.url, 
        formData.description,
        currentProvider
      );
      setFormData(prev => ({
        ...prev,
        category: aiSuggestion.category,
        categories: [...new Set([...prev.categories, ...aiSuggestion.categories])],
        tags: [...new Set([...prev.tags, ...aiSuggestion.tags])]
      }));
    } catch (error) {
      console.error('AI categorization failed:', error);
      toast({
        title: "AI Enhancement Failed",
        description: "Could not enhance the tool with AI. Please fill in the details manually.",
        variant: "destructive"
      });
    } finally {
      setIsAIProcessing(false);
      setProcessingField(null);
    }
  };

  const generateAIContent = async (field: 'description' | 'notes' | 'tags') => {
    if (!formData.name || !formData.url) {
      setErrors(prev => ({
        ...prev,
        name: !formData.name ? 'Tool name is required for AI generation' : '',
        url: !formData.url ? 'URL is required for AI generation' : ''
      }));
      return;
    }

    setIsAIProcessing(true);
    setProcessingField(field);
    try {
      console.log(`Starting AI generation for ${field} using ${currentProvider}...`);
      const content = await generateFieldContent(
        formData.name, 
        formData.url, 
        field, 
        formData.description,
        currentProvider
      );
      console.log(`AI generation result for ${field}:`, content);
      
      if (field === 'tags' && Array.isArray(content.tags)) {
        setFormData(prev => ({
          ...prev,
          tags: [...new Set([...prev.tags, ...content.tags])]
        }));
      } else if (field === 'description' && content.description) {
        setFormData(prev => ({
          ...prev,
          description: content.description
        }));
      } else if (field === 'notes' && content.notes) {
        setFormData(prev => ({
          ...prev,
          notes: content.notes
        }));
      } else {
        throw new Error(`No valid content was generated for ${field}`);
      }

      toast({
        title: "AI Generation Complete",
        description: `${field.charAt(0).toUpperCase() + field.slice(1)} has been generated using ${currentProvider}.`,
      });
    } catch (error) {
      console.error(`AI ${field} generation failed:`, error);
      toast({
        title: "AI Generation Failed",
        description: error instanceof Error ? error.message : `Could not generate ${field}. Please fill in manually.`,
        variant: "destructive"
      });
    } finally {
      setIsAIProcessing(false);
      setProcessingField(null);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const copyApiKey = () => {
    if (formData.apiKey) {
      navigator.clipboard.writeText(formData.apiKey);
      toast({
        title: "Copied!",
        description: "API key copied to clipboard",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddCategory = () => {
    if (!categoryInput.trim()) return;
    
    if (!formData.categories.includes(categoryInput.trim())) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, categoryInput.trim()]
      }));
    }
    
    setCategoryInput('');
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat !== categoryToRemove)
    }));
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'custom') {
      // Use custom category input field
      setFormData(prev => ({
        ...prev,
        category: customCategory,
      }));
    } else if (value && !formData.categories.includes(value)) {
      // Add to categories array
      setFormData(prev => ({
        ...prev,
        category: value,
        categories: [...prev.categories, value]
      }));
    }
  };

  const handleCustomCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomCategory(value);
    setFormData(prev => ({ ...prev, category: value }));
    
    // Clear error if it exists
    if (errors.category && value.trim() !== '') {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.category;
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    
    if (validateForm()) {
      const categoryToUse = formData.category || formData.categories[0] || "Uncategorized";
      
      onSave({
        name: formData.name.trim(),
        url: formData.url.trim(),
        description: formData.description.trim() || undefined,
        category: categoryToUse,
        categories: formData.categories.length > 0 ? formData.categories : [categoryToUse],
        tags: formData.tags,
        isPinned: formData.isPinned,
        isFavorite: formData.isFavorite,
        email: formData.email.trim() || undefined,
        apiKey: formData.apiKey.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTool ? 'Edit Tool' : 'Add New Tool'}
          </DialogTitle>
          <DialogDescription>
            {editingTool 
              ? 'Update the details of your developer tool.' 
              : 'Add a new developer tool to your dashboard.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingTool && (
            <SmartInputParser onParsed={handleSmartParse} />
          )}

          {/* Show which AI provider is being used */}
          <div className="flex items-center justify-end">
            <div className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-md flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Using <span className="font-medium">
                {currentProvider === 'openai' ? 'OpenAI (GPT-4)' : 
                 currentProvider === 'anthropic' ? 'Claude' : 'Gemini AI'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className={errors.name ? "text-destructive" : ""}>Name*</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Tool name"
                className={errors.name ? "border-destructive" : ""}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-destructive flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="url" className={errors.url ? "text-destructive" : ""}>URL*</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://example.com"
                className={errors.url ? "border-destructive" : ""}
                aria-invalid={!!errors.url}
              />
              {errors.url && (
                <p className="text-xs text-destructive flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.url}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="description">Description</Label>
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => generateAIContent('description')}
                  disabled={isAIProcessing || !formData.name || !formData.url}
                  className="h-6 text-xs"
                >
                  {processingField === 'description' ? (
                    <>Loading...</>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the tool"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    value={formData.apiKey}
                    onChange={(e) => handleInputChange('apiKey', e.target.value)}
                    placeholder="API key (optional)"
                  />
                  {formData.apiKey && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={copyApiKey}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Primary Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className={formSubmitted && errors.categories ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
                <SelectItem value="custom">Custom Category</SelectItem>
              </SelectContent>
            </Select>
            {customCategory && (
              <Input
                placeholder="Enter custom category"
                value={customCategory}
                onChange={handleCustomCategoryChange}
                className="mt-2"
              />
            )}
            {formSubmitted && errors.categories && (
              <p className="text-xs text-destructive mt-1">{errors.categories}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="flex gap-2">
              <Input
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                placeholder="Add category and press Enter"
                className="flex-1"
              />
              <Button type="button" onClick={handleAddCategory} size="sm">
                Add
              </Button>
            </div>
            {formData.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.categories.map((category) => (
                  <Badge
                    key={category}
                    variant="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    {category}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveCategory(category)}
                    />
                  </Badge>
                ))}
              </div>
            )}
            {formSubmitted && errors.categories && (
              <p className="text-xs text-destructive mt-1">{errors.categories}</p>
            )}
          </div>



          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Tags</Label>
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => generateAIContent('tags')}
                  disabled={isAIProcessing || !formData.name || !formData.url}
                  className="h-6 text-xs"
                >
                  {processingField === 'tags' ? (
                    <>Loading...</>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag and press Enter"
                className="flex-1"
              />
              <Button type="button" onClick={handleAddTag} size="sm">
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="notes">Notes</Label>
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => generateAIContent('notes')}
                  disabled={isAIProcessing || !formData.name || !formData.url}
                  className="h-6 text-xs"
                >
                  {processingField === 'notes' ? (
                    <>Loading...</>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Custom notes, TODOs, or additional information..."
              rows={3}
            />
          </div>
          
          <div className="text-xs text-muted-foreground">
            * Required fields
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPinned"
              checked={formData.isPinned}
              onChange={(e) => setFormData({...formData, isPinned: e.target.checked})}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="isPinned" className="cursor-pointer">Pin this tool</Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFavorite"
              checked={formData.isFavorite}
              onChange={(e) => setFormData({...formData, isFavorite: e.target.checked})}
              className="rounded border-gray-300 text-rose-500 focus:ring-rose-500"
            />
            <Label htmlFor="isFavorite" className="cursor-pointer">Add to favorites</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editingTool ? 'Update' : 'Add'} Tool
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
