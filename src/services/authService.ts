import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'neon-auth-user-id';
const DEVICE_ID_KEY = 'dev-dashboard-device-id';

// Warm the user ID cache from an active session on app start.
export const initAuth = async (): Promise<void> => {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = (data as { session?: { user?: { id?: string } } })?.session?.user?.id;
    if (userId) localStorage.setItem(USER_ID_KEY, userId);
  } catch {
    // ignore — falls back to device ID
  }
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return (data as { session?: { user?: unknown } })?.session?.user || null;
};

// Synchronous — reads from the cache set after login / initAuth.
export const getUserId = (): string => {
  const cached = localStorage.getItem(USER_ID_KEY);
  if (cached) return cached;

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
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
    const session = (data as { session?: { user?: { id?: string } } })?.session;
    if (session?.user?.id) localStorage.setItem(USER_ID_KEY, session.user.id);
    return !!session;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  console.log(`Attempting to log in with email: ${email}`);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Error logging in:', error);
    throw error;
  }

  const userId = (data as { session?: { user?: { id?: string } } })?.session?.user?.id;
  if (userId) localStorage.setItem(USER_ID_KEY, userId);

  console.log('Login successful');
  return data;
};

export const signUpWithEmail = async (email: string, password: string) => {
  console.log(`Attempting to sign up with email: ${email}`);

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    console.error('Error signing up:', error);
    throw error;
  }

  const userId = (data as { session?: { user?: { id?: string } } })?.session?.user?.id;
  if (userId) localStorage.setItem(USER_ID_KEY, userId);

  console.log('Signup successful');
  return data;
};

export const logout = async () => {
  console.log('Logging out...');

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error logging out:', error);
    throw error;
  }

  localStorage.removeItem(USER_ID_KEY);
  console.log('Logout successful');
};

// Migrate tools that were saved under the old 'anonymous' user ID to the current user.
export const migrateAnonymousTools = async (): Promise<boolean> => {
  try {
    console.log('Checking for tools with anonymous user ID...');
    const currentUserId = getUserId();

    if (currentUserId === 'anonymous') return false;

    const { data: anonymousTools, error: queryError } = await supabase
      .from('tools')
      .select('*')
      .eq('user_id', 'anonymous');

    if (queryError || !anonymousTools || anonymousTools.length === 0) return false;

    console.log(`Found ${anonymousTools.length} tools with anonymous user ID, migrating...`);

    let successCount = 0;
    for (const tool of anonymousTools) {
      const { error: insertError } = await supabase
        .from('tools')
        .insert({
          ...tool,
          id: undefined,
          user_id: currentUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      if (!insertError) successCount++;
    }

    console.log(`Successfully migrated ${successCount} out of ${anonymousTools.length} tools`);
    return successCount > 0;
  } catch (error) {
    console.error('Error migrating anonymous tools:', error);
    return false;
  }
};
