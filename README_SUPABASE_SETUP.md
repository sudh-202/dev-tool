# Setting Up Supabase for Developer Dashboard

This guide explains how to set up Supabase to work with your developer tools dashboard application.

## Supabase Schema Setup

You need to create or modify the following tables in your Supabase database:

### 1. Tools Table

Create a table called `tools` with the following columns:

| Column Name | Type | Description |
|-------------|------|-------------|
| id | uuid | Primary key (auto-generated) |
| title | text | Tool name |
| url | text | Tool URL |
| description | text (nullable) | Tool description |
| category | text | Tool category |
| is_favorite | boolean | Whether the tool is pinned/favorite |
| logo_url | text (nullable) | URL to tool logo |
| rating | integer (nullable) | Tool rating (1-5) |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Update timestamp |
| user_id | uuid | Foreign key to auth.users |

Missing fields from the app model that you should add:
- `tags` (text array): Add this column to store tags
- `email` (text, nullable): Store associated email
- `api_key` (text, nullable): Store API key (should be encrypted in a real app)
- `notes` (text, nullable): Store notes about the tool
- `last_used` (timestamp, nullable): Track when the tool was last used
- `usage_count` (integer, default 0): Track how many times the tool was used

### 2. Row Level Security Policies

Set up Row Level Security (RLS) to restrict access to only authenticated users:

1. Enable RLS on the `tools` table
2. Create a policy:
   - Name: Allow individual read access
   - Operation: SELECT
   - Using expression: `auth.uid() = user_id`
3. Create another policy:
   - Name: Allow individual write access
   - Operations: INSERT, UPDATE, DELETE
   - Using expression: `auth.uid() = user_id`

## Authentication Setup

1. Go to the Authentication tab in your Supabase dashboard
2. Configure Email authentication (or other methods you prefer)
3. Set up the redirect URLs for your application

## Environment Variables

Create a `.env` file in your project root with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Next Steps

1. Create a simple login/signup page to authenticate users
2. Add the ability to export/import tools
3. Implement additional tables for Quick Notes and other features
4. Add more user preferences (themes, layouts, default views)

## Data Migration

To migrate existing tools from localStorage to Supabase:

1. Export your tools from localStorage using browser devtools
2. Format them to match the Supabase schema
3. Import them using the Supabase SQL editor or API

## Security Considerations

- Don't store sensitive API keys directly in the database; consider encryption
- Set up proper authentication checks throughout the application
- Use environment variables for all sensitive configuration
- Implement rate limiting for API endpoints 