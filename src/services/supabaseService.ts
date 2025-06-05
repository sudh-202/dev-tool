import { supabase } from '@/integrations/supabase/client';
import { Tool } from '@/types';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { v4 as uuidv4 } from 'uuid'; // You might need to install this
import { getUserId } from './authService';

// Flag to track Supabase availability
let isSupabaseAvailable = true;

// Function to check if Supabase is available
export const checkSupabaseAvailability = async (): Promise<boolean> => {
  try {
    // Use a direct REST API call to check if the database is accessible
    const response = await fetch(`${supabase.supabaseUrl}/rest/v1/?apikey=${supabase.supabaseKey}`, {
      method: 'GET',
      headers: {
        'apikey': supabase.supabaseKey,
        'Authorization': `Bearer ${supabase.supabaseKey}`,
      },
    });
    
    // If the API responds with a 200 status, we consider Supabase available
    isSupabaseAvailable = response.status === 200;
    console.log(`Supabase API check: ${isSupabaseAvailable ? 'Available' : 'Unavailable'}`);
    
    if (isSupabaseAvailable) {
      // Also check if the tools table exists
      const { data, error } = await supabase.from('tools').select('count').limit(1);
      
      if (error) {
        console.log('Error checking tools table:', error.message, error.code);
        // Only consider the table missing if we get the specific "relation does not exist" error
        if (error.code === '42P01') { // Table doesn't exist error
          console.log('Supabase connection available but tools table does not exist');
          console.log('Falling back to localStorage until database is set up');
          isSupabaseAvailable = false;
        } else {
          // For other errors, we might still be able to use Supabase
          console.log('Encountered database error, but will try to use Supabase anyway');
        }
      } else {
        console.log('Tools table exists and is accessible');
      }
    }
    
    return isSupabaseAvailable;
  } catch (error) {
    console.error('Supabase availability check failed:', error);
    isSupabaseAvailable = false;
    return false;
  }
};

// Local storage fallback functions
const getLocalTools = (): Tool[] => {
  try {
    const toolsJson = localStorage.getItem('dev-dashboard-tools');
    return toolsJson ? JSON.parse(toolsJson) : [];
  } catch (error) {
    console.error('Error reading tools from localStorage:', error);
    return [];
  }
};

const saveLocalTools = (tools: Tool[]): void => {
  try {
    localStorage.setItem('dev-dashboard-tools', JSON.stringify(tools));
  } catch (error) {
    console.error('Error saving tools to localStorage:', error);
  }
};

// Type for mapping between application Tool and Supabase tool
type SupabaseTool = Tables<'tools'>;

// Function to convert Supabase tool to application Tool
const mapFromSupabase = (tool: SupabaseTool): Tool => {
  // For backward compatibility, handle missing fields
  return {
    id: tool.id,
    name: tool.title,
    url: tool.url || '',
    description: tool.description || '',
    // Convert string to array if stored as string in some cases, or use empty array as default
    tags: Array.isArray(tool.tags) ? tool.tags : (typeof tool.tags === 'string' ? JSON.parse(tool.tags) : []),
    category: tool.category,
    isPinned: tool.is_favorite || false,
    favicon: tool.logo_url || undefined,
    createdAt: new Date(tool.created_at),
    updatedAt: new Date(tool.updated_at),
    rating: tool.rating || undefined,
    // Handle custom fields that might not be in the base schema
    email: (tool as any).email || undefined,
    apiKey: (tool as any).api_key || undefined,
    notes: (tool as any).notes || undefined,
    lastUsed: (tool as any).last_used ? new Date((tool as any).last_used) : undefined,
    usageCount: (tool as any).usage_count || 0,
  };
};

// Function to convert application Tool to Supabase format for insert
const mapToSupabaseInsert = (tool: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>): TablesInsert<'tools'> => {
  // Base fields that are in the schema
  const baseFields: TablesInsert<'tools'> = {
    title: tool.name,
    url: tool.url,
    description: tool.description,
    category: tool.category,
    is_favorite: tool.isPinned,
    logo_url: tool.favicon,
    rating: tool.rating,
    // We need to get the user ID from auth
    user_id: getUserId(),
  };

  // Add any additional fields that may not be in the base schema
  // Cast to any to allow adding custom fields
  const customFields: any = {
    tags: tool.tags,
    email: tool.email,
    api_key: tool.apiKey,
    notes: tool.notes,
    usage_count: tool.usageCount || 0,
  };

  return {
    ...baseFields,
    ...customFields,
  };
};

// Function to convert application Tool to Supabase format for update
const mapToSupabaseUpdate = (tool: Tool): TablesInsert<'tools'> & Record<string, any> => {
  // Base fields that are in the schema
  const baseFields: TablesInsert<'tools'> = {
    id: tool.id,
    title: tool.name,
    url: tool.url,
    description: tool.description,
    category: tool.category,
    is_favorite: tool.isPinned,
    logo_url: tool.favicon,
    rating: tool.rating,
    // User ID should not change on update
    user_id: getUserId(),
  };

  // Add any additional fields that may not be in the base schema
  const customFields: Record<string, any> = {
    tags: tool.tags,
    email: tool.email,
    api_key: tool.apiKey,
    notes: tool.notes,
    last_used: tool.lastUsed?.toISOString(),
    usage_count: tool.usageCount || 0,
    updated_at: new Date().toISOString(),
  };

  return {
    ...baseFields,
    ...customFields,
  };
};

// CRUD Functions

// Get all tools
export const getAllTools = async (): Promise<Tool[]> => {
  // First check if Supabase is available
  if (!(await checkSupabaseAvailability())) {
    console.log('Supabase unavailable, using localStorage fallback');
    return getLocalTools();
  }

  try {
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .eq('user_id', getUserId());

    if (error) {
      console.error('Error fetching tools:', error);
      // Fall back to localStorage
      return getLocalTools();
    }

    return (data || []).map(mapFromSupabase);
  } catch (error) {
    console.error('Exception fetching tools:', error);
    // Fall back to localStorage
    return getLocalTools();
  }
};

// Get tool by ID
export const getToolById = async (id: string): Promise<Tool | null> => {
  // First check if Supabase is available
  if (!(await checkSupabaseAvailability())) {
    console.log('Supabase unavailable, using localStorage fallback');
    const tools = getLocalTools();
    return tools.find(tool => tool.id === id) || null;
  }

  try {
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .eq('id', id)
      .eq('user_id', getUserId())
      .single();

    if (error) {
      console.error(`Error fetching tool with ID ${id}:`, error);
      // Fall back to localStorage
      const tools = getLocalTools();
      return tools.find(tool => tool.id === id) || null;
    }

    return data ? mapFromSupabase(data) : null;
  } catch (error) {
    console.error(`Exception fetching tool with ID ${id}:`, error);
    // Fall back to localStorage
    const tools = getLocalTools();
    return tools.find(tool => tool.id === id) || null;
  }
};

// Create a new tool
export const createTool = async (tool: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tool> => {
  // First check if Supabase is available
  if (!(await checkSupabaseAvailability())) {
    console.log('Supabase unavailable, using localStorage fallback');
    const newTool: Tool = {
      ...tool,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const tools = getLocalTools();
    saveLocalTools([newTool, ...tools]);
    return newTool;
  }

  try {
    const supabaseTool = mapToSupabaseInsert(tool);
    
    const { data, error } = await supabase
      .from('tools')
      .insert(supabaseTool)
      .select()
      .single();

    if (error) {
      console.error('Error creating tool:', error);
      // Fall back to localStorage
      const newTool: Tool = {
        ...tool,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const tools = getLocalTools();
      saveLocalTools([newTool, ...tools]);
      return newTool;
    }

    return mapFromSupabase(data);
  } catch (error) {
    console.error('Exception creating tool:', error);
    // Fall back to localStorage
    const newTool: Tool = {
      ...tool,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const tools = getLocalTools();
    saveLocalTools([newTool, ...tools]);
    return newTool;
  }
};

// Create multiple tools at once (for AI generated tools)
export const createMultipleTools = async (
  tools: Array<Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Tool[]> => {
  // First check if Supabase is available
  if (!(await checkSupabaseAvailability())) {
    console.log('Supabase unavailable, using localStorage fallback');
    const newTools: Tool[] = tools.map(tool => ({
      ...tool,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const existingTools = getLocalTools();
    saveLocalTools([...newTools, ...existingTools]);
    return newTools;
  }

  try {
    const supabaseTools = tools.map(mapToSupabaseInsert);
    
    const { data, error } = await supabase
      .from('tools')
      .insert(supabaseTools)
      .select();

    if (error) {
      console.error('Error creating multiple tools:', error);
      // Fall back to localStorage
      const newTools: Tool[] = tools.map(tool => ({
        ...tool,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      const existingTools = getLocalTools();
      saveLocalTools([...newTools, ...existingTools]);
      return newTools;
    }

    return (data || []).map(mapFromSupabase);
  } catch (error) {
    console.error('Exception creating multiple tools:', error);
    // Fall back to localStorage
    const newTools: Tool[] = tools.map(tool => ({
      ...tool,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const existingTools = getLocalTools();
    saveLocalTools([...newTools, ...existingTools]);
    return newTools;
  }
};

// Update a tool
export const updateTool = async (tool: Tool): Promise<Tool> => {
  // First check if Supabase is available
  if (!(await checkSupabaseAvailability())) {
    console.log('Supabase unavailable, using localStorage fallback');
    const updatedTool = { ...tool, updatedAt: new Date() };
    const tools = getLocalTools();
    saveLocalTools(tools.map(t => t.id === tool.id ? updatedTool : t));
    return updatedTool;
  }

  try {
    const supabaseTool = mapToSupabaseUpdate(tool);
    
    const { data, error } = await supabase
      .from('tools')
      .update(supabaseTool)
      .eq('id', tool.id)
      .eq('user_id', getUserId())
      .select()
      .single();

    if (error) {
      console.error(`Error updating tool with ID ${tool.id}:`, error);
      // Fall back to localStorage
      const updatedTool = { ...tool, updatedAt: new Date() };
      const tools = getLocalTools();
      saveLocalTools(tools.map(t => t.id === tool.id ? updatedTool : t));
      return updatedTool;
    }

    return mapFromSupabase(data);
  } catch (error) {
    console.error(`Exception updating tool with ID ${tool.id}:`, error);
    // Fall back to localStorage
    const updatedTool = { ...tool, updatedAt: new Date() };
    const tools = getLocalTools();
    saveLocalTools(tools.map(t => t.id === tool.id ? updatedTool : t));
    return updatedTool;
  }
};

// Toggle pin status
export const toggleToolPin = async (id: string, isPinned: boolean): Promise<void> => {
  // First check if Supabase is available
  if (!(await checkSupabaseAvailability())) {
    console.log('Supabase unavailable, using localStorage fallback');
    const tools = getLocalTools();
    saveLocalTools(tools.map(tool => {
      if (tool.id === id) {
        return { ...tool, isPinned, updatedAt: new Date() };
      }
      return tool;
    }));
    return;
  }

  try {
    const { error } = await supabase
      .from('tools')
      .update({ is_favorite: isPinned, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', getUserId());

    if (error) {
      console.error(`Error toggling pin status for tool with ID ${id}:`, error);
      // Fall back to localStorage
      const tools = getLocalTools();
      saveLocalTools(tools.map(tool => {
        if (tool.id === id) {
          return { ...tool, isPinned, updatedAt: new Date() };
        }
        return tool;
      }));
    }
  } catch (error) {
    console.error(`Exception toggling pin status for tool with ID ${id}:`, error);
    // Fall back to localStorage
    const tools = getLocalTools();
    saveLocalTools(tools.map(tool => {
      if (tool.id === id) {
        return { ...tool, isPinned, updatedAt: new Date() };
      }
      return tool;
    }));
  }
};

// Update tool usage count
export const updateToolUsage = async (id: string): Promise<void> => {
  // First check if Supabase is available
  if (!(await checkSupabaseAvailability())) {
    console.log('Supabase unavailable, using localStorage fallback');
    const tools = getLocalTools();
    saveLocalTools(tools.map(tool => {
      if (tool.id === id) {
        return { 
          ...tool, 
          lastUsed: new Date(), 
          usageCount: (tool.usageCount || 0) + 1,
          updatedAt: new Date() 
        };
      }
      return tool;
    }));
    return;
  }

  try {
    // Get the current tool first to increment its usage count
    const { data: tool, error: getError } = await supabase
      .from('tools')
      .select('usage_count')
      .eq('id', id)
      .eq('user_id', getUserId())
      .single();

    if (getError) {
      console.error(`Error getting tool with ID ${id}:`, getError);
      // Fall back to localStorage
      const tools = getLocalTools();
      saveLocalTools(tools.map(tool => {
        if (tool.id === id) {
          return { 
            ...tool, 
            lastUsed: new Date(), 
            usageCount: (tool.usageCount || 0) + 1,
            updatedAt: new Date() 
          };
        }
        return tool;
      }));
      return;
    }

    const currentCount = tool?.usage_count || 0;
    
    const { error } = await supabase
      .from('tools')
      .update({ 
        usage_count: currentCount + 1,
        last_used: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .eq('user_id', getUserId());

    if (error) {
      console.error(`Error updating usage for tool with ID ${id}:`, error);
      // Fall back to localStorage
      const tools = getLocalTools();
      saveLocalTools(tools.map(tool => {
        if (tool.id === id) {
          return { 
            ...tool, 
            lastUsed: new Date(), 
            usageCount: (tool.usageCount || 0) + 1,
            updatedAt: new Date() 
          };
        }
        return tool;
      }));
    }
  } catch (error) {
    console.error(`Exception updating usage for tool with ID ${id}:`, error);
    // Fall back to localStorage
    const tools = getLocalTools();
    saveLocalTools(tools.map(tool => {
      if (tool.id === id) {
        return { 
          ...tool, 
          lastUsed: new Date(), 
          usageCount: (tool.usageCount || 0) + 1,
          updatedAt: new Date() 
        };
      }
      return tool;
    }));
  }
};

// Delete a tool
export const deleteTool = async (id: string): Promise<void> => {
  // First check if Supabase is available
  if (!(await checkSupabaseAvailability())) {
    console.log('Supabase unavailable, using localStorage fallback');
    const tools = getLocalTools();
    saveLocalTools(tools.filter(tool => tool.id !== id));
    return;
  }

  try {
    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('id', id)
      .eq('user_id', getUserId());

    if (error) {
      console.error(`Error deleting tool with ID ${id}:`, error);
      // Fall back to localStorage
      const tools = getLocalTools();
      saveLocalTools(tools.filter(tool => tool.id !== id));
    }
  } catch (error) {
    console.error(`Exception deleting tool with ID ${id}:`, error);
    // Fall back to localStorage
    const tools = getLocalTools();
    saveLocalTools(tools.filter(tool => tool.id !== id));
  }
}; 