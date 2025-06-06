import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
  return data.session?.user || null;
};

export const getUserId = (): string => {
  // Get the user ID from the session
  // Since getSession() is async in Supabase JS v2, we need to handle it differently
  // For simplicity, use localStorage to get user ID if available
  try {
    // Try to get the userId from localStorage where Supabase stores the session
    const storedSession = localStorage.getItem('sb-mijwhvxjzomypzhypgtc-auth-token');
    if (storedSession) {
      const session = JSON.parse(storedSession);
      const userId = session.user?.id;
      if (userId) {
        console.log('Retrieved user ID from session:', userId);
        return userId;
      }
    }
  } catch (error) {
    console.error('Error parsing stored session:', error);
  }
  
  // If no authenticated user, use a persistent device ID instead of 'anonymous'
  let deviceId = localStorage.getItem('dev-dashboard-device-id');
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem('dev-dashboard-device-id', deviceId);
    console.log('Created new device ID:', deviceId);
  } else {
    console.log('Using existing device ID:', deviceId);
  }
  
  return deviceId;
};

export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return !!data.session;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  console.log(`Attempting to log in with email: ${email}`);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Error logging in:', error);
    throw error;
  }
  
  console.log('Login successful:', data);
  return data;
};

export const signUpWithEmail = async (email: string, password: string) => {
  console.log(`Attempting to sign up with email: ${email}`);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) {
    console.error('Error signing up:', error);
    throw error;
  }
  
  console.log('Signup successful:', data);
  return data;
};

export const logout = async () => {
  console.log('Logging out...');
  
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error logging out:', error);
    throw error;
  }
  
  console.log('Logout successful');
};

// Migrate tools from 'anonymous' user ID to current device ID
export const migrateAnonymousTools = async (): Promise<boolean> => {
  try {
    console.log('Checking for tools with anonymous user ID...');
    
    // Get the current user ID (should be device ID if not logged in)
    const currentUserId = getUserId();
    
    // Skip if current ID is 'anonymous' (which shouldn't happen now)
    if (currentUserId === 'anonymous') {
      console.log('Current user ID is anonymous, skipping migration');
      return false;
    }
    
    // Check if we have any tools with 'anonymous' user ID
    const { data: anonymousTools, error: queryError } = await supabase
      .from('tools')
      .select('*')
      .eq('user_id', 'anonymous');
      
    if (queryError) {
      console.error('Error querying anonymous tools:', queryError);
      return false;
    }
    
    if (!anonymousTools || anonymousTools.length === 0) {
      console.log('No tools found with anonymous user ID');
      return false;
    }
    
    console.log(`Found ${anonymousTools.length} tools with anonymous user ID, migrating...`);
    
    // For each tool, clone it with the current user ID
    let successCount = 0;
    for (const tool of anonymousTools) {
      // Create a new tool with current user ID
      const { error: insertError } = await supabase
        .from('tools')
        .insert({
          ...tool,
          id: undefined, // Let Supabase generate a new ID
          user_id: currentUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error migrating anonymous tool:', insertError);
      } else {
        successCount++;
      }
    }
    
    console.log(`Successfully migrated ${successCount} out of ${anonymousTools.length} tools`);
    
    // If any were successfully migrated, return true
    return successCount > 0;
    
  } catch (error) {
    console.error('Error migrating anonymous tools:', error);
    return false;
  }
}; 