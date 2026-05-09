-- Neon DB Schema
-- Run this SQL in the Neon Console SQL Editor after creating your project.
-- gen_random_uuid() is PostgreSQL built-in (no extension needed in Neon).

-- Tools table
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

CREATE INDEX IF NOT EXISTS tools_user_id_idx ON public.tools (user_id);
CREATE INDEX IF NOT EXISTS tools_category_idx ON public.tools (category);
CREATE INDEX IF NOT EXISTS tools_is_favorite_idx ON public.tools (is_favorite);

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Snippets table
CREATE TABLE IF NOT EXISTS public.snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    code TEXT NOT NULL,
    language TEXT NOT NULL,
    description TEXT,
    tags TEXT[],
    is_favorite BOOLEAN DEFAULT false,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS snippets_user_id_idx ON public.snippets (user_id);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    start_date TEXT,
    end_date TEXT,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects (user_id);

-- Project Features table
CREATE TABLE IF NOT EXISTS public.project_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    progress NUMERIC DEFAULT 0,
    assignee TEXT,
    due_date TEXT,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS project_features_project_id_idx ON public.project_features (project_id);
CREATE INDEX IF NOT EXISTS project_features_user_id_idx ON public.project_features (user_id);

-- Features table
CREATE TABLE IF NOT EXISTS public.features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    progress NUMERIC DEFAULT 0,
    assignee TEXT,
    project_id UUID,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS features_user_id_idx ON public.features (user_id);

-- Documentation table
CREATE TABLE IF NOT EXISTS public.documentation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT,
    description TEXT,
    url TEXT,
    framework TEXT,
    version TEXT,
    tags TEXT[],
    is_favorite BOOLEAN DEFAULT false,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS documentation_user_id_idx ON public.documentation (user_id);

-- APIs table
CREATE TABLE IF NOT EXISTS public.apis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    documentation_url TEXT,
    rate_limit TEXT,
    is_favorite BOOLEAN DEFAULT false,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS apis_user_id_idx ON public.apis (user_id);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx ON public.chat_messages (user_id);

-- AI Generations table
CREATE TABLE IF NOT EXISTS public.ai_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    input_data TEXT NOT NULL,
    output_data TEXT,
    status TEXT DEFAULT 'pending',
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_generations_user_id_idx ON public.ai_generations (user_id);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    due_date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
