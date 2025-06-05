-- Create the tools table
CREATE TABLE IF NOT EXISTS public.tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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