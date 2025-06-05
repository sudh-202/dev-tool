import { supabase } from '@/integrations/supabase/client';

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
  
  // Fallback to anonymous ID if no user is logged in
  console.log('No user ID found, using anonymous ID');
  return 'anonymous';
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