import { useState, useEffect } from 'react';
import { Tool } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X, Eye, EyeOff, Copy, AlertCircle } from 'lucide-react';
import { categorizeAndTagTool } from '@/services/aiService';
import { toast } from '@/hooks/use-toast';
import { SmartInputParser } from './SmartInputParser';
import { ToolRating } from './ToolRating';

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
    tags: [] as string[],
    isPinned: false,
    email: '',
    apiKey: '',
    notes: '',
    rating: 0,
  });
  const [tagInput, setTagInput] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    if (editingTool) {
      setFormData({
        name: editingTool.name,
        url: editingTool.url,
        description: editingTool.description || '',
        category: editingTool.category,
        tags: [...editingTool.tags],
        isPinned: editingTool.isPinned,
        email: editingTool.email || '',
        apiKey: editingTool.apiKey || '',
        notes: editingTool.notes || '',
        rating: editingTool.rating || 0,
      });
    } else {
      setFormData({
        name: '',
        url: '',
        description: '',
        category: '',
        tags: [],
        isPinned: false,
        email: '',
        apiKey: '',
        notes: '',
        rating: 0,
      });
    }
    setTagInput('');
    setShowApiKey(false);
    setErrors({});
    setFormSubmitted(false);
  }, [editingTool, isOpen]);

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
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
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
    try {
      const aiSuggestion = await categorizeAndTagTool(formData.name, formData.url, formData.description);
      setFormData(prev => ({
        ...prev,
        category: aiSuggestion.category,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    
    const isValid = validateForm();
    if (!isValid) {
      // Show error toast
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    onSave({
      ...formData,
      rating: formData.rating || 0,
      usageCount: editingTool?.usageCount || 0,
      lastUsed: editingTool?.lastUsed,
    });
    onClose();
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
            <Label htmlFor="description">Description</Label>
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

          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="category" className={errors.category ? "text-destructive" : ""}>Category*</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger 
                  className={errors.category ? "border-destructive text-destructive" : formData.category ? "" : "text-muted-foreground"}
                  aria-invalid={!!errors.category}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-destructive flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.category}
                </p>
              )}
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAIEnhance}
                disabled={isAIProcessing || !formData.name || !formData.url}
                className="h-10"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                {isAIProcessing ? 'AI...' : 'AI Enhance'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Rating (Optional)</Label>
              {formData.rating > 0 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 text-xs text-muted-foreground"
                  onClick={() => setFormData(prev => ({ ...prev, rating: 0 }))}
                >
                  Clear
                </Button>
              )}
            </div>
            <ToolRating
              rating={formData.rating}
              onRatingChange={(rating) => setFormData(prev => ({ ...prev, rating }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
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
            <Label htmlFor="notes">Notes</Label>
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
