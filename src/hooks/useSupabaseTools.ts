import { useState, useEffect, useCallback } from 'react';
import { Tool } from '@/types';
import {
  getAllTools,
  createTool,
  updateTool,
  deleteTool,
  toggleToolPin,
  updateToolUsage,
  createMultipleTools,
  checkSupabaseAvailability,
} from '@/services/supabaseService';
import { useLocalStorage } from './useLocalStorage';
import { toast } from '@/hooks/use-toast';
import { isLoggedIn } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';

export function useSupabaseTools() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  
  // Keep tools in localStorage as a fallback/cache
  const [cachedTools, setCachedTools] = useLocalStorage<Tool[]>('dev-dashboard-tools-cache', []);

  // Check authentication first
  useEffect(() => {
    async function checkAuth() {
      try {
        const loggedIn = await isLoggedIn();
        console.log('Authentication status checked:', loggedIn);
        setAuthChecked(true);
        
        // Also check Supabase connection
        const supabaseAvailable = await checkSupabaseAvailability();
        setIsSupabaseConnected(supabaseAvailable);
        console.log('Supabase connection status:', supabaseAvailable);
      } catch (err) {
        console.error('Failed to check authentication status:', err);
        setAuthChecked(true); // Proceed anyway
        setIsSupabaseConnected(false);
      }
    }
    
    checkAuth();
  }, []);

  // Load tools from Supabase on mount and when auth state changes
  useEffect(() => {
    if (!authChecked) return; // Wait for auth check
    
    async function loadTools() {
      console.log("Attempting to load tools from Supabase...");
      try {
        setLoading(true);
        
        // Debug authentication
        console.log("Getting user ID for loading tools...");
        const userId = localStorage.getItem('sb-mijwhvxjzomypzhypgtc-auth-token') 
          ? JSON.parse(localStorage.getItem('sb-mijwhvxjzomypzhypgtc-auth-token') || '{}')?.user?.id 
          : 'anonymous';
        console.log("Current user ID:", userId);
        
        const supabaseTools = await getAllTools();
        console.log("Tools loaded from Supabase:", supabaseTools);
        
        setTools(supabaseTools);
        // Update the cache with the latest data
        setCachedTools(supabaseTools);
        
        // Show success toast
        if (supabaseTools.length > 0) {
          toast({
            title: "Tools loaded",
            description: `${supabaseTools.length} tools loaded successfully`,
          });
        } else {
          console.log("No tools found in Supabase database");
          toast({
            title: "No tools found",
            description: "Your tools dashboard is empty. Add some tools to get started!",
          });
        }
      } catch (err) {
        console.error('Failed to load tools from Supabase:', err);
        
        // Get more detailed error information
        if (err instanceof Error) {
          console.error('Error details:', err.message);
          console.error('Error stack:', err.stack);
        }
        
        setError(err instanceof Error ? err : new Error('Failed to load tools'));
        
        // Show error toast
        toast({
          title: "Error loading tools",
          description: err instanceof Error 
            ? `${err.message}. Check the console for more details.` 
            : "Failed to load tools from Supabase",
          variant: "destructive",
        });
        
        // If there's an error, try to use cached tools
        if (cachedTools.length > 0) {
          console.log("Using cached tools instead:", cachedTools);
          setTools(cachedTools);
          
          toast({
            title: "Using cached tools",
            description: `${cachedTools.length} tools loaded from local cache`,
          });
        }
      } finally {
        setLoading(false);
      }
    }

    loadTools();
  }, [authChecked]); // Only run when authChecked changes

  // Add a new tool
  const addTool = useCallback(async (tool: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log("Adding new tool:", tool);
    try {
      // Make sure the tool has a categories array
      const toolWithCategories = {
        ...tool,
        categories: tool.categories || (tool.category ? [tool.category] : [])
      };

      const newTool = await createTool(toolWithCategories);
      console.log("Tool added successfully:", newTool);
      
      setTools(prev => [newTool, ...prev]);
      setCachedTools(prev => [newTool, ...prev]);
      
      toast({
        title: "Tool added",
        description: `${tool.name} has been added to your dashboard`,
      });
      
      return newTool;
    } catch (err) {
      console.error('Failed to add tool:', err);
      setError(err instanceof Error ? err : new Error('Failed to add tool'));
      
      toast({
        title: "Error adding tool",
        description: err instanceof Error ? err.message : "Failed to add tool",
        variant: "destructive",
      });
      
      throw err;
    }
  }, []);

  // Add multiple tools (for AI generation)
  const addMultipleTools = useCallback(async (newTools: Array<Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      // Make sure each tool has a categories array
      const toolsWithCategories = newTools.map(tool => ({
        ...tool,
        categories: tool.categories || (tool.category ? [tool.category] : [])
      }));
      
      const addedTools = await createMultipleTools(toolsWithCategories);
      setTools(prev => [...addedTools, ...prev]);
      setCachedTools(prev => [...addedTools, ...prev]);
      return addedTools;
    } catch (err) {
      console.error('Failed to add multiple tools:', err);
      setError(err instanceof Error ? err : new Error('Failed to add multiple tools'));
      throw err;
    }
  }, []);

  // Update a tool
  const updateToolData = useCallback(async (tool: Tool) => {
    try {
      const updatedTool = await updateTool(tool);
      setTools(prev => prev.map(t => t.id === tool.id ? updatedTool : t));
      setCachedTools(prev => prev.map(t => t.id === tool.id ? updatedTool : t));
      return updatedTool;
    } catch (err) {
      console.error('Failed to update tool:', err);
      setError(err instanceof Error ? err : new Error('Failed to update tool'));
      throw err;
    }
  }, []);

  // Toggle pin status
  const togglePin = useCallback(async (id: string) => {
    const tool = tools.find(t => t.id === id);
    if (!tool) {
      console.error(`Cannot toggle pin: Tool with ID ${id} not found`);
      return;
    }

    const updatedIsPinned = !tool.isPinned;

    try {
      await toggleToolPin(id, updatedIsPinned);
      
      // Update local state optimistically
      const updatedTool = { ...tool, isPinned: updatedIsPinned, updatedAt: new Date() };
      setTools(prev => prev.map(t => t.id === id ? updatedTool : t));
      setCachedTools(prev => prev.map(t => t.id === id ? updatedTool : t));
    } catch (err) {
      console.error('Failed to toggle pin status:', err);
      setError(err instanceof Error ? err : new Error('Failed to toggle pin status'));
      throw err;
    }
  }, [tools]);

  // Delete a tool
  const removeTool = useCallback(async (id: string) => {
    try {
      await deleteTool(id);
      setTools(prev => prev.filter(tool => tool.id !== id));
      setCachedTools(prev => prev.filter(tool => tool.id !== id));
    } catch (err) {
      console.error('Failed to delete tool:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete tool'));
      throw err;
    }
  }, []);

  // Track usage when a tool is clicked
  const trackToolUsage = useCallback(async (id: string) => {
    try {
      await updateToolUsage(id);
      
      // Update local state optimistically
      setTools(prev => prev.map(tool => {
        if (tool.id === id) {
          return {
            ...tool,
            lastUsed: new Date(),
            usageCount: (tool.usageCount || 0) + 1,
            updatedAt: new Date(),
          };
        }
        return tool;
      }));

      setCachedTools(prev => prev.map(tool => {
        if (tool.id === id) {
          return {
            ...tool,
            lastUsed: new Date(),
            usageCount: (tool.usageCount || 0) + 1,
            updatedAt: new Date(),
          };
        }
        return tool;
      }));
    } catch (err) {
      console.error('Failed to track tool usage:', err);
      // Don't throw error here as this is not critical
    }
  }, []);

  // Update to handle multiple categories and favorites
  const toggleFavorite = async (id: string) => {
    try {
      const tool = tools.find(t => t.id === id);
      if (!tool) return;
      
      const updatedTool = { 
        ...tool, 
        isFavorite: !tool.isFavorite,
        updatedAt: new Date() 
      };
      
      // If using Supabase
      if (isSupabaseConnected) {
        const { error } = await supabase
          .from('tools')
          .update({ 
            isFavorite: updatedTool.isFavorite,
            updatedAt: updatedTool.updatedAt
          })
          .eq('id', id);
          
        if (error) throw error;
      } 
      // If using localStorage
      else {
        const updatedTools = tools.map(t => 
          t.id === id ? updatedTool : t
        );
        localStorage.setItem('dev-tools', JSON.stringify(updatedTools));
      }
      
      // Update local state
      setTools(prevTools => 
        prevTools.map(t => t.id === id ? updatedTool : t)
      );
      
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  };

  // Add a tool to a category
  const addToolToCategory = async (toolId: string, category: string) => {
    try {
      const tool = tools.find(t => t.id === toolId);
      if (!tool) return;
      
      // Make sure we don't add duplicate categories
      if (tool.categories.includes(category)) return;
      
      const updatedCategories = [...tool.categories, category];
      const updatedTool = { 
        ...tool, 
        categories: updatedCategories,
        updatedAt: new Date() 
      };
      
      // If using Supabase
      if (isSupabaseConnected) {
        const { error } = await supabase
          .from('tools')
          .update({ 
            categories: updatedCategories,
            updatedAt: updatedTool.updatedAt
          })
          .eq('id', toolId);
          
        if (error) throw error;
      } 
      // If using localStorage
      else {
        const updatedTools = tools.map(t => 
          t.id === toolId ? updatedTool : t
        );
        localStorage.setItem('dev-tools', JSON.stringify(updatedTools));
      }
      
      // Update local state
      setTools(prevTools => 
        prevTools.map(t => t.id === toolId ? updatedTool : t)
      );
      
    } catch (error) {
      console.error('Error adding tool to category:', error);
      throw error;
    }
  };

  // Remove a tool from a category
  const removeToolFromCategory = async (toolId: string, category: string) => {
    try {
      const tool = tools.find(t => t.id === toolId);
      if (!tool) return;
      
      const updatedCategories = tool.categories.filter(c => c !== category);
      const updatedTool = { 
        ...tool, 
        categories: updatedCategories,
        updatedAt: new Date() 
      };
      
      // If using Supabase
      if (isSupabaseConnected) {
        const { error } = await supabase
          .from('tools')
          .update({ 
            categories: updatedCategories,
            updatedAt: updatedTool.updatedAt
          })
          .eq('id', toolId);
          
        if (error) throw error;
      } 
      // If using localStorage
      else {
        const updatedTools = tools.map(t => 
          t.id === toolId ? updatedTool : t
        );
        localStorage.setItem('dev-tools', JSON.stringify(updatedTools));
      }
      
      // Update local state
      setTools(prevTools => 
        prevTools.map(t => t.id === toolId ? updatedTool : t)
      );
      
    } catch (error) {
      console.error('Error removing tool from category:', error);
      throw error;
    }
  };

  return {
    tools,
    loading,
    error,
    addTool,
    addMultipleTools,
    updateTool: updateToolData,
    removeTool,
    togglePin,
    toggleFavorite,
    addToolToCategory,
    removeToolFromCategory,
    trackToolUsage,
    refreshTools: async () => {
      try {
        setLoading(true);
        const supabaseTools = await getAllTools();
        setTools(supabaseTools);
        setCachedTools(supabaseTools);
        setLoading(false);
      } catch (err) {
        console.error('Failed to refresh tools:', err);
        setError(err instanceof Error ? err : new Error('Failed to refresh tools'));
        setLoading(false);
        throw err;
      }
    }
  };
} 