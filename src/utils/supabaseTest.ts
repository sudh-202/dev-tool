import { supabase } from '@/integrations/supabase/client';

export async function testSupabaseConnection() {
  console.log('Testing Neon DB connection...');

  try {
    // 1. Check auth service
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('Auth service error:', authError);
    } else {
      console.log('Auth session exists:', !!(authData as { session?: unknown })?.session);
    }

    // 2. Check if the tools table is reachable
    const { error: dbError } = await supabase.from('tools').select('id').limit(1);

    if (dbError) {
      console.error('DB error:', dbError.message, dbError.code);
      const needsSetup = dbError.code === '42P01';
      return { success: !authError, needsSetup };
    }

    console.log('Neon DB connection successful');
    return { success: true, needsSetup: false };
  } catch (error) {
    console.error('Unexpected error testing Neon connection:', error);
    return { success: false, needsSetup: true, error };
  }
}
