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

// Default API key as fallback
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAp3Thg9Y9ZcGcQsmtqzshmqrB3EyFssbs';

// Log API key status for debugging
console.log(`Gemini API Key status: ${GEMINI_API_KEY ? 'Available' : 'Missing'}`);

export async function generateToolsFromPrompt(prompt: string, toolCount: number = 5): Promise<AIResponse> {
  console.log(`Starting tool generation with prompt: "${prompt}" and count: ${toolCount}`);
  
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

  if (!GEMINI_API_KEY) {
    console.error('Gemini API key is not set');
    throw new Error('Gemini API key is missing. Please check your environment variables.');
  }

  try {
    console.log('Making API request to Gemini...');
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
      const errorData = await response.json().catch(() => null);
      console.error('API error response:', errorData);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Raw API response:', JSON.stringify(data).slice(0, 200) + '...');
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error('Unexpected API response structure:', data);
      throw new Error('Invalid response from Gemini API');
    }
    
    const text = data.candidates[0].content.parts[0].text;
    
    // Clean the response to extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', text);
      throw new Error('No valid JSON found in response');
    }

    try {
      const jsonText = jsonMatch[0];
      console.log('Extracted JSON:', jsonText.slice(0, 200) + '...');
      const aiResponse = JSON.parse(jsonText);
      
      // Validate response structure
      if (!aiResponse.tools || !Array.isArray(aiResponse.tools) || aiResponse.tools.length === 0) {
        console.error('Invalid tools array in response:', aiResponse);
        throw new Error('Generated response is missing tools array');
      }
      
      return aiResponse;
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Original text:', jsonMatch[0]);
      throw new Error('Failed to parse JSON response from API');
    }
  } catch (error) {
    console.error('Error generating tools from prompt:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to generate tools. Please try again.');
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
    console.log(`Searching for tools with query: "${query}"`);
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
      const errorData = await response.json().catch(() => null);
      console.error('API error response:', errorData);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error('Unexpected API response structure:', data);
      throw new Error('Invalid response from Gemini API');
    }
    
    const text = data.candidates[0].content.parts[0].text;
    
    // Clean the response to extract JSON
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in response:', text);
      throw new Error('No valid JSON found in response');
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse JSON response from API');
    }
  } catch (error) {
    console.error('Error searching for tools:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to search for tools. Please try again.');
  }
}
