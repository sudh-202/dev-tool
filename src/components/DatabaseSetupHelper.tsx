import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Database, ExternalLink, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// The SQL script to create the necessary tables
const setupScript = `CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the tools table
CREATE TABLE IF NOT EXISTS public.tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    url TEXT,
    description TEXT,
    category TEXT NOT NULL,
    is_favorite BOOLEAN DEFAULT false,
    logo_url TEXT,
    rating NUMERIC,
    tags TEXT[],
    email TEXT,
    api_key TEXT,
    notes TEXT,
    last_used TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id TEXT NOT NULL
);

-- Add RLS (Row Level Security) policy
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to see only their own tools
CREATE POLICY "Users can view their own tools" 
ON public.tools 
FOR SELECT 
USING (auth.uid()::text = user_id OR user_id = 'anonymous');

-- Policy for authenticated users to insert their own tools
CREATE POLICY "Users can insert their own tools" 
ON public.tools 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id OR user_id = 'anonymous');

-- Policy for authenticated users to update their own tools
CREATE POLICY "Users can update their own tools" 
ON public.tools 
FOR UPDATE 
USING (auth.uid()::text = user_id OR user_id = 'anonymous');

-- Policy for authenticated users to delete their own tools
CREATE POLICY "Users can delete their own tools" 
ON public.tools 
FOR DELETE 
USING (auth.uid()::text = user_id OR user_id = 'anonymous');

-- Index to improve query performance
CREATE INDEX IF NOT EXISTS tools_user_id_idx ON public.tools (user_id);
CREATE INDEX IF NOT EXISTS tools_category_idx ON public.tools (category);
CREATE INDEX IF NOT EXISTS tools_is_favorite_idx ON public.tools (is_favorite);

-- Sample tool insertion (optional)
INSERT INTO public.tools (title, url, description, category, user_id, tags) 
VALUES 
('GitHub', 'https://github.com', 'Collaborative code hosting platform', 'Development', 'anonymous', ARRAY['git', 'code', 'repository']),
('VS Code', 'https://code.visualstudio.com', 'Popular code editor', 'Development', 'anonymous', ARRAY['editor', 'ide', 'coding']),
('Figma', 'https://figma.com', 'Collaborative design tool', 'Design', 'anonymous', ARRAY['design', 'ui', 'ux']);

-- Create the documentation table (used by Prompt / Docs)
CREATE TABLE IF NOT EXISTS public.documentation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    description TEXT,
    url TEXT,
    framework TEXT,
    version TEXT,
    tags TEXT[],
    is_favorite BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id TEXT NOT NULL
);

ALTER TABLE public.documentation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documentation" 
ON public.documentation 
FOR SELECT 
USING (auth.uid()::text = user_id OR user_id = 'anonymous');

CREATE POLICY "Users can insert their own documentation" 
ON public.documentation 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id OR user_id = 'anonymous');

CREATE POLICY "Users can update their own documentation" 
ON public.documentation 
FOR UPDATE 
USING (auth.uid()::text = user_id OR user_id = 'anonymous');

CREATE POLICY "Users can delete their own documentation" 
ON public.documentation 
FOR DELETE 
USING (auth.uid()::text = user_id OR user_id = 'anonymous');

CREATE INDEX IF NOT EXISTS documentation_user_id_idx ON public.documentation (user_id);
CREATE INDEX IF NOT EXISTS documentation_category_idx ON public.documentation (category);`;

export function DatabaseSetupHelper({ 
  onComplete, 
  onRefresh 
}: { 
  onComplete: () => void;
  onRefresh?: () => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://mijwhvxjzomypzhypgtc.supabase.co";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(setupScript);
    setCopied(true);
    toast({
      title: 'SQL script copied',
      description: 'The setup script has been copied to your clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    toast({
      title: 'Refreshing application',
      description: 'Checking database connection again...',
    });
    
    if (onRefresh) {
      await onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <span>Database Setup Required</span>
        </CardTitle>
        <CardDescription>
          Your Supabase database needs some setup before you can use it with this application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 text-amber-800 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <h4 className="font-medium">Missing Database Table</h4>
            <p className="text-sm">The tools table is missing in your Supabase project. Follow the instructions below to set it up.</p>
          </div>
        </div>

        <Tabs defaultValue="instructions">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="script">SQL Script</TabsTrigger>
          </TabsList>

          <TabsContent value="instructions" className="p-4 border rounded-md mt-4 space-y-4">
            <ol className="list-decimal pl-4 space-y-3 text-sm">
              <li>
                <span className="font-medium">Open your Supabase dashboard</span>
                <div className="mt-1">
                  <a 
                    href="https://app.supabase.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 hover:underline"
                  >
                    Go to Supabase Dashboard <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </li>
              <li>
                <span className="font-medium">Select your project</span>
                <div className="mt-1 text-muted-foreground">
                  Find and select the project with URL: {supabaseUrl.replace("https://", "")}
                </div>
              </li>
              <li>
                <span className="font-medium">Open the SQL Editor</span>
                <div className="mt-1 text-muted-foreground">
                  In the left sidebar, click on "SQL Editor"
                </div>
              </li>
              <li>
                <span className="font-medium">Create a new query</span>
                <div className="mt-1 text-muted-foreground">
                  Click the "+" button to create a new SQL query
                </div>
              </li>
              <li>
                <span className="font-medium">Paste the SQL script</span>
                <div className="mt-1 text-muted-foreground">
                  Copy the SQL script from the "SQL Script" tab and paste it into the query editor
                </div>
              </li>
              <li>
                <span className="font-medium">Run the query</span>
                <div className="mt-1 text-muted-foreground">
                  Click the "Run" button to execute the SQL script
                </div>
              </li>
              <li>
                <span className="font-medium">Return to the app</span>
                <div className="mt-1 text-muted-foreground">
                  Come back to this app and refresh the page to start using Supabase
                </div>
              </li>
            </ol>
          </TabsContent>

          <TabsContent value="script" className="p-4 border rounded-md mt-4">
            <div className="relative">
              <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto text-xs">
                <code>{setupScript}</code>
              </pre>
              <Button 
                size="sm" 
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="mr-2" onClick={onComplete}>
          Use localStorage Instead
        </Button>
        <Button 
          variant="outline" 
          className="mr-2" 
          onClick={handleRefresh}
        >
          <span className="mr-1">Refresh Page</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21 2v6h-6"></path>
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
            <path d="M3 22v-6h6"></path>
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
          </svg>
        </Button>
        <Button onClick={() => window.open("https://app.supabase.com", "_blank")}>
          Open Supabase Dashboard
        </Button>
      </CardFooter>
    </Card>
  );
} 
