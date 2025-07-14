import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MigrationPrompt } from "./components/MigrationPrompt";
import { testSupabaseConnection } from "./utils/supabaseTest";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseSetupHelper } from "./components/DatabaseSetupHelper";
import { getAllTools } from "./services/supabaseService";
import { getUserId, migrateAnonymousTools } from "./services/authService";
import { checkMigrationNeeded } from "./utils/migrationUtils";
import { Button } from "@/components/ui/button";
import { AIProviderProvider } from "@/contexts/AIProviderContext";
import { AIModelSelector } from "@/components/AIModelSelector";

const queryClient = new QueryClient();

const App = () => {
  const [showMigration, setShowMigration] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [showDbSetup, setShowDbSetup] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);

  useEffect(() => {
    // Check for development mode keyboard shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Alt+D to show dev tools
      if (e.ctrlKey && e.altKey && e.code === "KeyD") {
        setShowDevTools(!showDevTools);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDevTools]);

  useEffect(() => {
    // Test Supabase connection
    const testConnection = async () => {
      console.log("============== SUPABASE CONNECTION TEST ==============");
      console.log("Supabase URL:", supabase.supabaseUrl);
      console.log("API key length:", supabase.supabaseKey.length);
      console.log("Testing Supabase connection...");
      
      try {
        const result = await testSupabaseConnection();
        console.log("Connection test result:", result);
        
        if (result.needsSetup) {
          console.log("Supabase needs setup. Database tables missing.");
          setShowDbSetup(true);
        } else {
          console.log("Database appears to be properly set up.");
          setShowDbSetup(false);
          
          // Only check for migration if database is set up and connected
          if (result.success) {
            // Check if migration is needed
            const migrationNeeded = await checkMigrationNeeded();
            if (migrationNeeded) {
              console.log("Migration needed - showing dialog");
              setShowMigration(true);
            } else {
              console.log("No migration needed");
            }
          }
        }
        
        if (!result.success) {
          console.error("Failed to connect to Supabase. Check your configuration.");
          setSupabaseError("Failed to connect to Supabase. Check console for details.");
          toast({
            title: "Supabase Connection Error",
            description: "Failed to connect to the database. Using local storage instead.",
            variant: "destructive",
          });
        } else if (!result.needsSetup) {
          console.log("Supabase connection test passed!");
          toast({
            title: "Connected to Supabase",
            description: "Database connection established successfully.",
          });
          
          // Try to migrate any tools created with the old 'anonymous' user ID
          try {
            console.log("Checking for tools to migrate from anonymous user...");
            const migratedTools = await migrateAnonymousTools();
            if (migratedTools) {
              console.log("Successfully migrated tools from anonymous user ID");
              toast({
                title: "Tools Recovered",
                description: "Previously created tools have been recovered.",
              });
            }
          } catch (migrationError) {
            console.error("Error during tool migration:", migrationError);
          }
        }
      } catch (error) {
        console.error("Error testing Supabase connection:", error);
        setSupabaseError("Error testing Supabase connection. Check console for details.");
      }
      console.log("==================================================");
    };

    testConnection();
  }, []);

  // Function to force a connection recheck
  const recheckConnection = async () => {
    console.log("Rechecking Supabase connection...");
    try {
      const result = await testSupabaseConnection();
      if (result.needsSetup) {
        setShowDbSetup(true);
      } else {
        setShowDbSetup(false);
        
        // Check migration after database is set up
        if (result.success) {
          const migrationNeeded = await checkMigrationNeeded();
          setShowMigration(migrationNeeded);
        }
      }
      
      if (result.success && !result.needsSetup) {
        toast({
          title: "Database Connected",
          description: "Successfully connected to Supabase database.",
        });
      }
    } catch (error) {
      console.error("Error rechecking connection:", error);
    }
  };
  
  // Reset migration state (for testing)
  const resetMigrationState = () => {
    localStorage.removeItem('migration-completed');
    toast({
      title: "Migration State Reset",
      description: "Migration state has been reset. Reload to show migration dialog.",
    });
    // Recheck after a short delay to allow the toast to display
    setTimeout(recheckConnection, 1000);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AIProviderProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          
          {/* Migration Dialog */}
          <Dialog open={showMigration} onOpenChange={setShowMigration}>
            <DialogContent className="sm:max-w-md">
              <DialogTitle>Migrate Your Tools</DialogTitle>
              <DialogDescription>
                Migrate your existing tools from localStorage to your Supabase database
              </DialogDescription>
              <MigrationPrompt onComplete={() => {
                setShowMigration(false);
              }} />
            </DialogContent>
          </Dialog>

          {/* Database Setup Dialog */}
          <Dialog open={showDbSetup} onOpenChange={setShowDbSetup}>
            <DialogContent className="sm:max-w-2xl">
              <DialogTitle>Database Setup Required</DialogTitle>
              <DialogDescription>
                Your Supabase database needs setup before you can use it
              </DialogDescription>
              <DatabaseSetupHelper 
                onComplete={() => setShowDbSetup(false)} 
                onRefresh={recheckConnection}
              />
            </DialogContent>
          </Dialog>

          {/* Developer Tools (hidden by default, press Ctrl+Alt+D to show) */}
          {showDevTools && (
            <div className="fixed bottom-4 right-4 z-50 bg-slate-900 p-4 rounded-md shadow-lg border border-slate-700">
              <h3 className="text-white text-sm font-medium mb-2">Developer Tools</h3>
              <div className="space-y-2">
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={resetMigrationState}
                  className="w-full text-xs"
                >
                  Reset Migration State
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={recheckConnection}
                  className="w-full text-xs"
                >
                  Recheck Connection
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowDevTools(false)}
                  className="w-full text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Supabase Error Alert */}
          {supabaseError && (
            <div className="fixed top-4 right-4 z-50 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 max-w-md rounded shadow-md">
              <div className="flex">
                <div className="py-1">
                  <svg className="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Database Connection Error</p>
                  <p className="text-sm">{supabaseError}</p>
                  <p className="text-sm mt-2">Using local storage for data persistence.</p>
                </div>
              </div>
            </div>
          )}

          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AIProviderProvider>
    </QueryClientProvider>
  );
};

export default App;
