interface AIGeneratedTool {
  name: string;
  url: string;
  description: string;
  category: string;
  tags: string[];
}

interface AIResponse {
  dashboard: string;
  tools: AIGeneratedTool[];
  categories: string[];
}

const GEMINI_API_KEY = 'AIzaSyAp3Thg9Y9ZcGcQsmtqzshmqrB3EyFssbs';

export async function generateToolsFromPrompt(prompt: string, toolCount: number = 5): Promise<AIResponse> {
  const systemPrompt = `You are a helpful AI that generates developer tool recommendations based on user prompts. 
  
Given a user prompt, respond with a JSON object containing:
- dashboard: A name for the dashboard theme
- tools: An array of exactly ${toolCount} relevant tools with name, url, description, category, and tags
- categories: An array of relevant categories

Example response format:
{
  "dashboard": "AI Research Tools",
  "tools": [
    {
      "name": "Hugging Face",
      "url": "https://huggingface.co",
      "description": "ML models and datasets platform",
      "category": "AI Tools",
      "tags": ["ml", "models", "datasets"]
    }
  ],
  "categories": ["AI Tools", "Research", "Development"]
}

Only respond with valid JSON. Ensure all URLs are real and working.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nUser prompt: "${prompt}"`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Clean the response to extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const aiResponse = JSON.parse(jsonMatch[0]);
    return aiResponse;
  } catch (error) {
    console.error('Error generating tools from prompt:', error);
    throw new Error('Failed to generate tools. Please try again.');
  }
}

export async function suggestSimilarTools(existingTools: string[]): Promise<AIGeneratedTool[]> {
  const prompt = `Based on these existing tools: ${existingTools.join(', ')}, suggest 3 similar or complementary tools that would be useful for this user's workflow.`;
  
  try {
    const response = await generateToolsFromPrompt(prompt);
    return response.tools.slice(0, 3);
  } catch (error) {
    console.error('Error suggesting similar tools:', error);
    return [];
  }
}

export async function categorizeAndTagTool(toolName: string, url: string, description?: string): Promise<{ category: string; tags: string[] }> {
  const prompt = `Categorize this tool and suggest relevant tags:
  Name: ${toolName}
  URL: ${url}
  Description: ${description || 'No description'}
  
  Respond with JSON: {"category": "CategoryName", "tags": ["tag1", "tag2", "tag3"]}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 512,
        }
      }),
    });

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        category: result.category || 'Other',
        tags: result.tags || []
      };
    }
  } catch (error) {
    console.error('Error categorizing tool:', error);
  }

  return { category: 'Other', tags: [] };
}

export async function searchTools(query: string): Promise<AIGeneratedTool[]> {
  const prompt = `Search for developer tools related to: "${query}".
  
  Return 5 relevant tools as a JSON array of objects with the following properties:
  - name: The name of the tool
  - url: The official URL (must be accurate)
  - description: A brief description (20-30 words)
  - category: A suitable category
  - tags: An array of 3-5 relevant tags
  
  Return only the JSON array without any other text.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Clean the response to extract JSON
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error searching for tools:', error);
    return [];
  }
}
