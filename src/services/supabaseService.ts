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
  // Return a properly formatted Tool with categories as an array
  return {
    id: tool.id,
    name: tool.title,
    url: tool.url || '',
    description: tool.description || '',
    category: tool.category || 'Other', // Maintain category field for backward compatibility
    isPinned: Boolean(tool.is_favorite),
    tags: Array.isArray(tool.tags) ? tool.tags : [],
    createdAt: new Date(tool.created_at),
    updatedAt: new Date(tool.updated_at),
    favicon: tool.logo_url || undefined,
    rating: tool.rating || 0,
    // Handle multiple categories
    categories: Array.isArray(tool.categories) ? tool.categories : 
               (tool.category ? [tool.category] : ['Other']),
    isFavorite: Boolean((tool as any).is_favorite || false),
    notes: (tool as any).notes,
    apiKey: (tool as any).api_key,
    email: (tool as any).email,
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
    category: tool.category || (tool.categories && tool.categories.length > 0 ? tool.categories[0] : undefined),
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
    categories: tool.categories || (tool.category ? [tool.category] : []),
    is_favorite: tool.isFavorite,
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
    category: tool.category || (tool.categories && tool.categories.length > 0 ? tool.categories[0] : undefined),
    is_favorite: tool.isPinned,
    logo_url: tool.favicon,
    rating: tool.rating,
    // User ID should not change on update
    user_id: getUserId(),
  };

  // Add any additional fields that may not be in the base schema
  const customFields: Record<string, any> = {
    tags: tool.tags,
    categories: tool.categories || (tool.category ? [tool.category] : []),
    is_favorite: tool.isFavorite,
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
    
    console.log('Updating tool with data:', JSON.stringify(supabaseTool, null, 2));
    
    const { data, error } = await supabase
      .from('tools')
      .update({
        ...supabaseTool,
        // Explicitly ensure categories is included in the update
        categories: tool.categories
      })
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

// Add a tool to a category directly
export const addToolToCategory = async (toolId: string, category: string): Promise<void> => {
  // First check if Supabase is available
  if (!(await checkSupabaseAvailability())) {
    console.log('Supabase unavailable, using localStorage fallback');
    const tools = getLocalTools();
    const tool = tools.find(t => t.id === toolId);
    if (!tool) return;
    
    // Get current categories, ensuring it's an array
    const currentCategories = Array.isArray(tool.categories) ? tool.categories : 
                             (tool.category ? [tool.category] : []);
    
    if (!currentCategories.includes(category)) {
      const updatedCategories = [...currentCategories, category];
      saveLocalTools(tools.map(t => {
        if (t.id === toolId) {
          return { 
            ...t, 
            categories: updatedCategories,
            updatedAt: new Date() 
          };
        }
        return t;
      }));
    }
    return;
  }

  try {
    console.log(`Starting to add tool ${toolId} to category ${category}`);
    
    // First get the current tool to get its categories
    const { data: toolData, error: getError } = await supabase
      .from('tools')
      .select('*')
      .eq('id', toolId)
      .eq('user_id', getUserId())
      .single();

    if (getError) {
      console.error(`Error getting tool data for ID ${toolId}:`, getError);
      throw getError;
    }

    console.log('Tool data retrieved:', toolData);

    // Get current categories, ensuring it's an array
    let currentCategories: string[] = [];
    
    if (toolData.categories === null || toolData.categories === undefined) {
      // Categories field is null/undefined, initialize with category field or empty array
      currentCategories = toolData.category ? [toolData.category] : [];
      console.log('Categories field is null/undefined, initialized with:', currentCategories);
    } else if (Array.isArray(toolData.categories)) {
      // Categories is already an array
      currentCategories = toolData.categories;
      console.log('Categories field is already an array:', currentCategories);
    } else if (typeof toolData.categories === 'string') {
      // Categories is a string, try to parse as JSON
      try {
        const parsed = JSON.parse(toolData.categories);
        currentCategories = Array.isArray(parsed) ? parsed : [toolData.categories];
        console.log('Categories field was a string, parsed as:', currentCategories);
      } catch (e) {
        // Not valid JSON, use as a single category
        currentCategories = [toolData.categories];
        console.log('Categories field was a string but not JSON, using as single category:', currentCategories);
      }
    } else {
      // Unknown format, fallback to category field or empty array
      currentCategories = toolData.category ? [toolData.category] : [];
      console.log('Categories field is in unknown format, using fallback:', currentCategories);
    }
    
    console.log('Final current categories:', currentCategories);
    
    // Only add if not already in the category
    if (!currentCategories.includes(category)) {
      const updatedCategories = [...currentCategories, category];
      
      console.log(`Adding tool ${toolId} to category ${category}`, {
        currentCategories,
        updatedCategories
      });
      
      // Create a complete update object with all the required fields
      const updateData = {
        categories: updatedCategories,
        updated_at: new Date().toISOString()
      };
      
      console.log('Update data:', updateData);
      
      const { error } = await supabase
        .from('tools')
        .update(updateData)
        .eq('id', toolId)
        .eq('user_id', getUserId());

      if (error) {
        console.error(`Error adding tool to category ${category}:`, error);
        
        // Handle potential JSONB column issues
        if (error.message?.includes('column "categories" is of type')) {
          console.error('This looks like a data type issue with the categories column in the database');
          
          // Try to fix by using JSON string instead
          const stringifyUpdate = {
            categories: JSON.stringify(updatedCategories),
            updated_at: new Date().toISOString()
          };
          
          console.log('Trying with stringified categories:', stringifyUpdate);
          
          const { error: retryError } = await supabase
            .from('tools')
            .update(stringifyUpdate)
            .eq('id', toolId)
            .eq('user_id', getUserId());
            
          if (retryError) {
            console.error('Second attempt failed:', retryError);
            throw retryError;
          } else {
            console.log('Second attempt succeeded with stringified categories');
            return;
          }
        }
        
        throw error;
      }
      
      console.log('Successfully added tool to category');
    } else {
      console.log(`Tool already in category ${category}, no update needed`);
    }
  } catch (error) {
    console.error(`Exception adding tool to category ${category}:`, error);
    
    // Check if it's a data type error and provide a clearer message
    if (error.message?.includes('column "categories" is of type')) {
      console.error('Database schema issue: The categories column may not be configured as an array type.');
    }
    
    throw error;
  }
};

// Check and fix categories column type
export const checkAndFixCategoriesColumn = async (): Promise<boolean> => {
  if (!(await checkSupabaseAvailability())) {
    console.log('Supabase unavailable, cannot check/fix categories column');
    return false;
  }

  try {
    console.log('Checking categories column type...');
    
    // First, let's try to get a tool with categories
    const { data: sampleTool, error: sampleError } = await supabase
      .from('tools')
      .select('categories')
      .limit(1)
      .single();
      
    if (sampleError) {
      console.error('Error getting sample tool:', sampleError);
      return false;
    }
    
    console.log('Sample tool categories:', sampleTool?.categories);
    
    // Check if categories is already an array
    if (Array.isArray(sampleTool?.categories)) {
      console.log('Categories column is already an array type, no fix needed');
      return true;
    }
    
    console.log('Categories column needs to be fixed, attempting to update all tools...');
    
    // Get all tools
    const { data: allTools, error: getAllError } = await supabase
      .from('tools')
      .select('id, categories, category')
      .eq('user_id', getUserId());
      
    if (getAllError) {
      console.error('Error getting all tools:', getAllError);
      return false;
    }
    
    console.log(`Found ${allTools?.length || 0} tools to update`);
    
    // Update each tool to ensure categories is an array
    let successCount = 0;
    for (const tool of allTools || []) {
      // Convert categories to array if needed
      let categoriesArray: string[];
      
      if (Array.isArray(tool.categories)) {
        categoriesArray = tool.categories;
      } else if (typeof tool.categories === 'string') {
        try {
          // Try to parse if it's a JSON string
          categoriesArray = JSON.parse(tool.categories);
          if (!Array.isArray(categoriesArray)) {
            categoriesArray = [tool.categories];
          }
        } catch {
          categoriesArray = [tool.categories];
        }
      } else if (tool.category) {
        categoriesArray = [tool.category];
      } else {
        categoriesArray = ['Other'];
      }
      
      // Update the tool
      const { error: updateError } = await supabase
        .from('tools')
        .update({
          categories: categoriesArray,
          updated_at: new Date().toISOString()
        })
        .eq('id', tool.id)
        .eq('user_id', getUserId());
        
      if (updateError) {
        console.error(`Error updating tool ${tool.id}:`, updateError);
      } else {
        successCount++;
      }
    }
    
    console.log(`Successfully updated ${successCount} out of ${allTools?.length || 0} tools`);
    return successCount > 0;
    
  } catch (error) {
    console.error('Exception checking/fixing categories column:', error);
    return false;
  }
};

// Recover tools from a possible previous session or ID
export const recoverTools = async (): Promise<boolean> => {
  try {
    console.log('Looking for tools from previous sessions...');
    
    // Get the current user ID
    const currentUserId = getUserId();
    console.log('Current user ID:', currentUserId);
    
    // Check if we have stored previous user IDs
    const previousIds = JSON.parse(localStorage.getItem('dev-dashboard-previous-user-ids') || '[]');
    console.log('Previous user IDs:', previousIds);
    
    // Add current anonymous ID to previous IDs if not there already
    const anonymousId = localStorage.getItem('dev-dashboard-anonymous-id');
    if (anonymousId && !previousIds.includes(anonymousId) && anonymousId !== currentUserId) {
      previousIds.push(anonymousId);
      localStorage.setItem('dev-dashboard-previous-user-ids', JSON.stringify(previousIds));
      console.log('Added anonymous ID to previous IDs:', anonymousId);
    }
    
    // Check if we have any tools for the current user
    const { data: currentTools, error: currentError } = await supabase
      .from('tools')
      .select('*')
      .eq('user_id', currentUserId);
      
    if (currentError) {
      console.error('Error checking current user tools:', currentError);
      return false;
    }
    
    // If we already have tools for the current user, no need to recover
    if (currentTools && currentTools.length > 0) {
      console.log(`Found ${currentTools.length} tools for current user ID, no recovery needed.`);
      return false;
    }
    
    console.log('No tools found for current user ID, checking previous IDs...');
    
    // Check if we have any tools in localStorage
    const localTools = getLocalTools();
    if (localTools.length > 0) {
      console.log(`Found ${localTools.length} tools in localStorage, migrating to current user ID...`);
      
      // Map tools to current user ID
      for (const tool of localTools) {
        const supabaseTool = mapToSupabaseInsert({
          ...tool,
          id: undefined,
          createdAt: undefined,
          updatedAt: undefined
        });
        
        const { error } = await supabase
          .from('tools')
          .insert(supabaseTool);
          
        if (error) {
          console.error('Error migrating localStorage tool:', error);
        }
      }
      
      return true;
    }
    
    // Check if we have tools from previous user IDs
    for (const prevId of previousIds) {
      console.log(`Checking for tools with previous user ID: ${prevId}`);
      
      const { data: prevTools, error: prevError } = await supabase
        .from('tools')
        .select('*')
        .eq('user_id', prevId);
        
      if (prevError) {
        console.error(`Error fetching tools for previous ID ${prevId}:`, prevError);
        continue;
      }
      
      if (prevTools && prevTools.length > 0) {
        console.log(`Found ${prevTools.length} tools from previous user ID ${prevId}, migrating...`);
        
        // Migrate tools to current user ID
        for (const prevTool of prevTools) {
          const tool = mapFromSupabase(prevTool);
          const supabaseTool = mapToSupabaseInsert({
            ...tool,
            id: undefined,
            createdAt: undefined,
            updatedAt: undefined
          });
          
          const { error: insertError } = await supabase
            .from('tools')
            .insert(supabaseTool);
            
          if (insertError) {
            console.error('Error migrating tool from previous user:', insertError);
          }
        }
        
        return true;
      }
    }
    
    console.log('No tools found from previous sessions.');
    return false;
    
  } catch (error) {
    console.error('Error in recoverTools:', error);
    return false;
  }
};

// Run diagnostics on tools table
export const runToolsDiagnostics = async (): Promise<void> => {
  console.log('==== Running tools table diagnostics ====');
  
  try {
    // Check if table exists
    console.log('Checking if tools table exists...');
    const { error: tableError } = await supabase
      .from('tools')
      .select('count(*)')
      .limit(1);
      
    if (tableError) {
      console.error('Error accessing tools table:', tableError);
      console.log('The tools table may not exist or you may not have access to it.');
      return;
    }
    
    console.log('Tools table exists and is accessible.');
    
    // Check column types by querying a sample row
    const { data: sampleRow, error: sampleError } = await supabase
      .from('tools')
      .select('*')
      .limit(1)
      .single();
      
    if (sampleError) {
      console.error('Error getting sample row:', sampleError);
      return;
    }
    
    console.log('Sample row from tools table:', sampleRow);
    
    // Log column types
    console.log('Column types:');
    for (const [column, value] of Object.entries(sampleRow)) {
      console.log(`  - ${column}: ${value === null ? 'null' : typeof value}`);
    }
    
    // Check total number of tools
    const { data: countData, error: countError } = await supabase
      .from('tools')
      .select('count(*)', { count: 'exact' });
      
    if (countError) {
      console.error('Error counting tools:', countError);
      return;
    }
    
    console.log(`Total tools in database: ${countData[0].count}`);
    
    // Check tools by user
    const { data: userTools, error: userError } = await supabase
      .from('tools')
      .select('user_id, count(*)')
      .group('user_id');
      
    if (userError) {
      console.error('Error getting tools by user:', userError);
      return;
    }
    
    console.log('Tools by user:');
    userTools.forEach(row => {
      console.log(`  - User ${row.user_id}: ${row.count} tools`);
    });
    
    // Check current user's tools
    const currentUserId = getUserId();
    const { data: currentUserTools, error: currentUserError } = await supabase
      .from('tools')
      .select('count(*)')
      .eq('user_id', currentUserId);
      
    if (currentUserError) {
      console.error('Error getting current user tools:', currentUserError);
      return;
    }
    
    console.log(`Current user (${currentUserId}) has ${currentUserTools[0].count} tools`);
    
    console.log('==== Diagnostics complete ====');
    
  } catch (error) {
    console.error('Error running tools diagnostics:', error);
  }
}; 