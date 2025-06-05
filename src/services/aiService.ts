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

export interface AIFieldContent {
  description?: string;
  tags?: string[];
  notes?: string;
}

// Import toast
import { toast } from '@/hooks/use-toast';

// API key configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAp3Thg9Y9ZcGcQsmtqzshmqrB3EyFssbs';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export type AIProvider = 'gemini' | 'openai' | 'anthropic';

// Log API key status for debugging
console.log(`Gemini API Key status: ${GEMINI_API_KEY ? 'Available' : 'Missing'}`);
console.log(`OpenAI API Key status: ${OPENAI_API_KEY ? 'Available' : 'Missing'}`);
console.log(`Anthropic API Key status: ${ANTHROPIC_API_KEY ? 'Available' : 'Missing'}`);

// Function to get available AI providers
export function getAvailableAIProviders(): { id: AIProvider; name: string }[] {
  const providers = [];
  
  if (GEMINI_API_KEY) {
    providers.push({ id: 'gemini', name: 'Gemini AI' });
  }
  
  if (OPENAI_API_KEY) {
    providers.push({ id: 'openai', name: 'OpenAI (GPT-4)' });
  }
  
  if (ANTHROPIC_API_KEY) {
    providers.push({ id: 'anthropic', name: 'Claude' });
  }
  
  return providers;
}

// Default provider selection
export const getDefaultProvider = (): AIProvider => {
  if (OPENAI_API_KEY) return 'openai';
  if (GEMINI_API_KEY) return 'gemini';
  if (ANTHROPIC_API_KEY) return 'anthropic';
  return 'gemini'; // Fallback
};

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

export async function categorizeAndTagTool(
  toolName: string, 
  url: string, 
  description?: string,
  provider: AIProvider = getDefaultProvider()
): Promise<{ category: string; tags: string[] }> {
  const prompt = `Categorize this tool and suggest relevant tags:
  Name: ${toolName}
  URL: ${url}
  Description: ${description || 'No description'}
  
  Respond with JSON: {"category": "CategoryName", "tags": ["tag1", "tag2", "tag3"]}`;

  try {
    console.log(`Categorizing tool with ${provider}: ${toolName}`);
    let generatedText = '';
    
    switch (provider) {
      case 'openai':
        generatedText = await generateWithOpenAI(prompt);
        break;
      case 'anthropic':
        generatedText = await generateWithAnthropic(prompt);
        break;
      case 'gemini':
      default:
        generatedText = await generateWithGemini(prompt);
        break;
    }
    
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    
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

export async function generateFieldContent(
  toolName: string,
  toolUrl: string,
  field: 'description' | 'notes' | 'tags',
  existingDescription?: string,
  provider: AIProvider = getDefaultProvider()
): Promise<AIFieldContent> {
  
  let prompt = '';
  
  switch (field) {
    case 'description':
      prompt = `Generate a concise description (30-50 words) for this developer tool:
Name: ${toolName}
URL: ${toolUrl}
      
Return ONLY the text of the description, nothing else.`;
      break;
    case 'notes':
      prompt = `Generate helpful usage notes for this developer tool:
Name: ${toolName}
URL: ${toolUrl}
Description: ${existingDescription || 'No description available'}

Include:
- Main use cases
- Tips for getting started
- Any key limitations
- Common alternatives

Return ONLY the notes text, nothing else.`;
      break;
    case 'tags':
      prompt = `Generate 3-5 relevant tags for this developer tool:
Name: ${toolName}
URL: ${toolUrl}
Description: ${existingDescription || 'No description available'}

Return ONLY a JSON array of tags, like this: ["tag1", "tag2", "tag3"]`;
      break;
  }

  try {
    console.log(`Generating ${field} with ${provider} for ${toolName}`);
    console.log(`Using prompt: ${prompt}`);

    let generatedText = '';
    
    switch (provider) {
      case 'openai':
        generatedText = await generateWithOpenAI(prompt);
        break;
      case 'anthropic':
        generatedText = await generateWithAnthropic(prompt);
        break;
      case 'gemini':
      default:
        generatedText = await generateWithGemini(prompt);
        break;
    }
    
    console.log(`Generated text for ${field}:`, generatedText);
    
    const result: AIFieldContent = {};
    
    switch (field) {
      case 'description':
        result.description = generatedText;
        break;
      case 'notes':
        result.notes = generatedText;
        break;
      case 'tags':
        try {
          // Try to parse as JSON array if it looks like one
          if (generatedText.startsWith('[') && generatedText.endsWith(']')) {
            const tagsArray = JSON.parse(generatedText);
            if (Array.isArray(tagsArray)) {
              result.tags = tagsArray.filter(tag => typeof tag === 'string');
              break;
            }
          }
          
          // Fallback: split by commas or lines if not valid JSON
          result.tags = generatedText
            .split(/[,\n]/)
            .map(tag => tag.trim().replace(/^["'\-•\s]+|["'\s]+$/g, ''))
            .filter(Boolean);
        } catch (error) {
          console.error('Error parsing tags:', error);
          // Fallback for any parsing errors
          result.tags = generatedText
            .split(/[,\n]/)
            .map(tag => tag.trim().replace(/^["'\-•\s]+|["'\s]+$/g, ''))
            .filter(Boolean);
        }
        break;
    }
    
    console.log(`Final result for ${field}:`, result);
    return result;
  } catch (error) {
    console.error(`Error generating ${field} with AI:`, error);
    toast({
      title: `AI Generation Failed`,
      description: `Could not generate ${field}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      variant: "destructive"
    });
    throw error instanceof Error 
      ? error 
      : new Error(`Failed to generate ${field}. Please try again.`);
  }
}

// Provider-specific generation functions

async function generateWithGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is missing. Please check your environment variables.');
  }

  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 512,
    }
  };
  
  console.log('Gemini request body:', JSON.stringify(requestBody));
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error response:', errorText);
    try {
      const errorData = JSON.parse(errorText);
      console.error('Parsed error data:', errorData);
    } catch (e) {
      // Text wasn't valid JSON
    }
    throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
    console.error('Unexpected Gemini API response structure:', data);
    throw new Error('Invalid response from Gemini API');
  }
  
  return data.candidates[0].content.parts[0].text.trim();
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is missing. Please check your environment variables.');
  }
  
  const requestBody = {
    model: "gpt-4-turbo", // Using the most capable model
    messages: [
      { role: "system", content: "You are a helpful assistant that provides concise, accurate information about developer tools." },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 500
  };
  
  console.log('OpenAI request (without credentials):', JSON.stringify(requestBody));
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error response:', errorText);
    try {
      const errorData = JSON.parse(errorText);
      console.error('Parsed OpenAI error:', errorData);
    } catch (e) {
      // Text wasn't valid JSON
    }
    throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
    console.error('Unexpected OpenAI API response structure:', data);
    throw new Error('Invalid response from OpenAI API');
  }
  
  return data.choices[0].message.content.trim();
}

async function generateWithAnthropic(prompt: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key is missing. Please check your environment variables.');
  }
  
  const requestBody = {
    model: "claude-3-haiku-20240307",
    messages: [
      { role: "user", content: prompt }
    ],
    max_tokens: 500,
    temperature: 0.3
  };
  
  console.log('Anthropic request (without credentials):', JSON.stringify(requestBody));
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Anthropic API error response:', errorText);
    try {
      const errorData = JSON.parse(errorText);
      console.error('Parsed Anthropic error:', errorData);
    } catch (e) {
      // Text wasn't valid JSON
    }
    throw new Error(`Anthropic API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.content || !data.content[0] || !data.content[0].text) {
    console.error('Unexpected Anthropic API response structure:', data);
    throw new Error('Invalid response from Anthropic API');
  }
  
  return data.content[0].text.trim();
}
