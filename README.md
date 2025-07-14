# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/22f9afad-8c9c-49cf-a3bf-ad989167ef83

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/22f9afad-8c9c-49cf-a3bf-ad989167ef83) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/22f9afad-8c9c-49cf-a3bf-ad989167ef83) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

# Developer Tools Dashboard

A modern, minimal web application to organize and access your developer tools. Built with React, TypeScript, and Supabase.

![Developer Tools Dashboard](./public/preview.png)

## Features

- 🧰 **Organize Your Tools**: Keep all your development resources in one place
- 🔍 **Quick Search**: Find any tool instantly 
- 🏷️ **Categorization**: Group tools by category and tags
- 📎 **Pin Important Tools**: Keep your most-used tools at the top
- 📊 **Usage Tracking**: See which tools you use most often
- 🌙 **Dark Mode**: Easy on the eyes
- 💾 **Local Storage**: Works offline with Supabase sync when online
- 🤖 **AI-powered**: Generate tool descriptions and organize with AI

## Setup

### Requirements

- Node.js 16+
- npm or yarn
- Supabase account (optional, for cloud sync)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/dev-dashboard.git
cd dev-dashboard
```

2. Install dependencies
```bash
npm install
# or
yarn
```

3. Create environment variables file (.env.local)
```bash
# Create a .env.local file with the following variables:
# Supabase configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

## AI Provider Setup

The app supports multiple AI providers for generating tool descriptions, tags, and notes. API keys are managed through the Settings page in the application:

### OpenAI
1. Sign up for an account at [OpenAI](https://platform.openai.com/)
2. Generate an API key in your dashboard
3. Add your API key in the Settings page of the application

### Google Gemini
1. Sign up at [Google AI Studio](https://aistudio.google.com/)
2. Get an API key from the credentials section
3. Add your API key in the Settings page of the application

### Anthropic Claude
1. Sign up at [Anthropic](https://console.anthropic.com/)
2. Generate an API key
3. Add your API key in the Settings page of the application

## Supabase Setup

See [README_SUPABASE_SETUP.md](./README_SUPABASE_SETUP.md) for detailed instructions on setting up Supabase for your project.

## License

MIT License
