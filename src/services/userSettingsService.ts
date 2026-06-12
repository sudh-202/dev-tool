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

const getLocalStorageKey = (userId: string) => `user-settings-${userId}`;

/**
 * Get user settings from localStorage
 */
export const getUserSettings = async (): Promise<UserSettings | null> => {
  const userId = getUserId();
  if (!userId) {
    console.error('No user ID available');
    return null;
  }

  try {
    const localData = localStorage.getItem(getLocalStorageKey(userId));
    if (localData) {
      return JSON.parse(localData) as UserSettings;
    }
    return null;
  } catch (e) {
    console.error('Error reading user settings from localStorage:', e);
    return null;
  }
};

/**
 * Save user settings to localStorage
 */
export const saveUserSettings = async (settings: Partial<UserSettings>): Promise<UserSettings | null> => {
  try {
    const userId = getUserId();

    if (!userId) {
      console.error('No user ID available');
      return null;
    }

    // Get current local settings first to merge with new updates
    let currentSettings: UserSettings = { user_id: userId };
    try {
      const localData = localStorage.getItem(getLocalStorageKey(userId));
      if (localData) {
        currentSettings = JSON.parse(localData) as UserSettings;
      }
    } catch (e) {
      console.error('Error parsing local user settings for merge:', e);
    }

    // Merge and persist
    const updatedSettings: UserSettings = {
      ...currentSettings,
      ...settings,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(getLocalStorageKey(userId), JSON.stringify(updatedSettings));
    console.log('User settings saved to localStorage successfully');
    return updatedSettings;
  } catch (error) {
    console.error('Error in saveUserSettings:', error);
    return null;
  }
};

/**
 * Update a specific API key
 */
export const updateApiKey = async (
  provider: 'openai' | 'openai7' | 'gemini' | 'anthropic' | 'anthropicclaude' | 'groq' | 'stabilityai' | 'replicate' | 'openrouter' | 'huggingface' | 'googleai' | 'deepseek',
  apiKey: string
): Promise<boolean> => {
  try {
    const userId = getUserId();

    if (!userId) {
      console.error('No user ID available');
      return false;
    }

    const keyField = `${provider}_api_key`;
    const result = await saveUserSettings({ [keyField]: apiKey });
    return !!result;
  } catch (error) {
    console.error(`Error updating ${provider} API key:`, error);
    return false;
  }
};

/**
 * Delete a specific API key
 */
export const deleteApiKey = async (
  provider: 'openai' | 'openai7' | 'gemini' | 'anthropic' | 'anthropicclaude' | 'groq' | 'stabilityai' | 'replicate' | 'openrouter' | 'huggingface' | 'googleai' | 'deepseek'
): Promise<boolean> => {
  try {
    const userId = getUserId();

    if (!userId) {
      console.error('No user ID available');
      return false;
    }

    const keyField = `${provider}_api_key`;
    const result = await saveUserSettings({ [keyField]: undefined });
    return !!result;
  } catch (error) {
    console.error(`Error deleting ${provider} API key:`, error);
    return false;
  }
};