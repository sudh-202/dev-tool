import { supabase } from '@/integrations/supabase/client';

// Function to test basic Supabase connectivity
export async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // 1. Test authentication service
    console.log('Testing Supabase auth service...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('Auth service response:', authError ? 'Error' : 'Success');
    if (authError) {
      console.error('Auth service error:', authError);
    } else {
      console.log('Auth session exists:', !!authData.session);
    }

    // 2. Test database connectivity with a raw API call instead of querying a specific table
    console.log('Testing Supabase database connectivity...');
    // We'll use a direct REST API call to check if the database is reachable
    const baseUrl = supabase.supabaseUrl;
    const apiKey = supabase.supabaseKey;
    
    try {
      const response = await fetch(`${baseUrl}/rest/v1/?apikey=${apiKey}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      console.log('REST API status:', response.status, response.statusText);
      const dbSuccess = response.status === 200;
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('REST API error:', errorText);
      } else {
        console.log('Supabase REST API is accessible');
      }
      
      // 3. Check if we need to setup the database
      let needsSetup = false;
      if (dbSuccess) {
        console.log('Checking if tools table exists...');
        // Try to query the tools table to see if it exists
        const { error: toolsError } = await supabase.from('tools').select('count').limit(1);
        
        if (toolsError && toolsError.code === '42P01') { // Table doesn't exist
          console.log('The tools table does not exist. Database setup is required.');
          console.log('Please run the SQL script to create the necessary tables.');
          needsSetup = true;
        } else if (!toolsError) {
          console.log('The tools table exists. Database is properly set up.');
          needsSetup = false;
        }
      }

      return { 
        success: !authError && dbSuccess, 
        needsSetup: needsSetup
      };
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return { success: !authError, needsSetup: true };
    }
  } catch (error) {
    console.error('Unexpected error testing Supabase:', error);
    return { success: false, error };
  }
} 