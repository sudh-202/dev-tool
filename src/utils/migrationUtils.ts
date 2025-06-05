import { Tool } from '@/types';
import { createMultipleTools } from '@/services/supabaseService';
import { supabase } from '@/integrations/supabase/client';
import { getAllTools, createTool } from '@/services/supabaseService';

/**
 * Check if migration from localStorage to Supabase is needed
 * @returns Promise<boolean> - true if migration is needed, false otherwise
 */
export const checkMigrationNeeded = async (): Promise<boolean> => {
  try {
    // Check if we've already completed migration
    if (localStorage.getItem('migration-completed') === 'true') {
      console.log('Migration previously marked as completed');
      return false;
    }
    
    // Get tools from localStorage
    const localStorageTools = localStorage.getItem('dev-dashboard-tools');
    if (!localStorageTools) {
      console.log('No tools in localStorage to migrate');
      return false;
    }
    
    // Parse localStorage tools
    const localTools = JSON.parse(localStorageTools);
    if (!Array.isArray(localTools) || localTools.length === 0) {
      console.log('No valid tools in localStorage to migrate');
      return false;
    }
    
    // Check if we have tools in Supabase
    const supabaseTools = await getAllTools();
    
    // If we have at least as many tools in Supabase as in localStorage,
    // we can assume migration is already done
    if (supabaseTools.length >= localTools.length) {
      console.log('Tools appear to be already migrated');
      localStorage.setItem('migration-completed', 'true');
      return false;
    }
    
    // If we reach here, we need to migrate
    console.log(`Migration needed: ${localTools.length} tools in localStorage, ${supabaseTools.length} in Supabase`);
    return true;
  } catch (error) {
    console.error('Error checking migration status:', error);
    // If we can't check, default to showing migration dialog (return true)
    return true;
  }
};

/**
 * Migrate tools from localStorage to Supabase
 * Handles duplicate detection and sets migration-completed flag
 * @returns Promise with migration results
 */
export const migrateLocalStorageToSupabase = async (): Promise<{ 
  success: boolean; 
  count?: number; 
  error?: string;
}> => {
  try {
    // Get tools from localStorage
    const localStorageTools = localStorage.getItem('dev-dashboard-tools');
    if (!localStorageTools) {
      return { success: true, count: 0 };
    }
    
    // Parse tools
    const tools = JSON.parse(localStorageTools);
    if (!Array.isArray(tools) || tools.length === 0) {
      return { success: true, count: 0 };
    }
    
    // Get existing tools from Supabase to avoid duplicates
    const existingTools = await getAllTools();
    const existingUrls = new Set(existingTools.map(tool => tool.url));
    
    // Filter out tools that already exist in Supabase (based on URL)
    const toolsToMigrate = tools.filter(tool => !existingUrls.has(tool.url));
    
    if (toolsToMigrate.length === 0) {
      // Mark migration as completed even though no new tools were added
      localStorage.setItem('migration-completed', 'true');
      return { success: true, count: 0 };
    }
    
    // Prepare tools for migration
    const toolsForSupabase = toolsToMigrate.map(tool => ({
      name: tool.name,
      url: tool.url,
      description: tool.description || '',
      tags: tool.tags || [],
      category: tool.category || 'Uncategorized',
      isPinned: tool.isPinned || false,
      favicon: tool.favicon,
      rating: tool.rating,
      email: tool.email,
      apiKey: tool.apiKey,
      notes: tool.notes,
      usageCount: tool.usageCount || 0,
    }));
    
    // Migrate tools using batch operation
    await createMultipleTools(toolsForSupabase);
    
    // Create a backup of original localStorage data
    localStorage.setItem('dev-dashboard-tools-backup', localStorageTools);
    
    // Mark migration as completed
    localStorage.setItem('migration-completed', 'true');
    
    return { success: true, count: toolsToMigrate.length };
  } catch (error) {
    console.error('Migration error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during migration'
    };
  }
}; 