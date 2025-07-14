import { supabase } from '@/integrations/supabase/client';
import { getUserId } from './authService';

export interface UserSettings {
  id?: string;
  user_id: string;
  openai_api_key?: string;
  openai7_api_key?: string;
  gemini_api_key?: string;
  anthropic_api_key?: string;
  anthropicclaude_api_key?: string;
  groq_api_key?: string;
  stabilityai_api_key?: string;
  replicate_api_key?: string;
  openrouter_api_key?: string;
  huggingface_api_key?: string;
  googleai_api_key?: string;
  deepseek_api_key?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get user settings from Supabase
 */
export const getUserSettings = async (): Promise<UserSettings | null> => {
  try {
    const userId = getUserId();
    
    if (!userId) {
      console.error('No user ID available');
      return null;
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user settings:', error);
      return null;
    }

    return data as UserSettings;
  } catch (error) {
    console.error('Error in getUserSettings:', error);
    return null;
  }
};

/**
 * Save user settings to Supabase
 */
export const saveUserSettings = async (settings: Partial<UserSettings>): Promise<UserSettings | null> => {
  try {
    const userId = getUserId();
    
    if (!userId) {
      console.error('No user ID available');
      return null;
    }

    // Check if settings already exist for this user
    const existingSettings = await getUserSettings();

    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user settings:', error);
        return null;
      }

      return data as UserSettings;
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          ...settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user settings:', error);
        return null;
      }

      return data as UserSettings;
    }
  } catch (error) {
    console.error('Error in saveUserSettings:', error);
    return null;
  }
};

/**
 * Update a specific API key
 */
export const updateApiKey = async (provider: 'openai' | 'openai7' | 'gemini' | 'anthropic' | 'anthropicclaude' | 'groq' | 'stabilityai' | 'replicate' | 'openrouter' | 'huggingface' | 'googleai' | 'deepseek', apiKey: string): Promise<boolean> => {
  try {
    const userId = getUserId();
    
    if (!userId) {
      console.error('No user ID available');
      return false;
    }

    const keyField = `${provider}_api_key`;
    const settings = { [keyField]: apiKey };

    const result = await saveUserSettings(settings);
    return !!result;
  } catch (error) {
    console.error(`Error updating ${provider} API key:`, error);
    return false;
  }
};

/**
 * Delete a specific API key
 */
export const deleteApiKey = async (provider: 'openai' | 'openai7' | 'gemini' | 'anthropic' | 'anthropicclaude' | 'groq' | 'stabilityai' | 'replicate' | 'openrouter' | 'huggingface' | 'googleai' | 'deepseek'): Promise<boolean> => {
  try {
    const userId = getUserId();
    
    if (!userId) {
      console.error('No user ID available');
      return false;
    }

    const keyField = `${provider}_api_key`;
    const settings = { [keyField]: null };

    const result = await saveUserSettings(settings);
    return !!result;
  } catch (error) {
    console.error(`Error deleting ${provider} API key:`, error);
    return false;
  }
};