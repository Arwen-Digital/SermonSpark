import { AgentSearch, BibleVerseSearch } from '@/types';

export interface ClaudeConfig {
  apiKey: string;
  model: 'claude-3-haiku-20240307' | 'claude-3-sonnet-20240229' | 'claude-3-opus-20240229';
  baseUrl?: string;
}

export class ClaudeService {
  private config: ClaudeConfig;

  constructor(config: ClaudeConfig) {
    this.config = config;
  }

  async searchBibleVerse(verse: string, translation: string): Promise<BibleVerseSearch> {
    const startTime = Date.now();
    
    try {
      const prompt = `Search for Bible verse: ${verse} ${translation}. Return only the actual Bible verse.`;
      
      const response = await fetch(this.config.baseUrl || 'https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      const responseTimeMs = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const verseText = data.content?.[0]?.text?.trim() || '';

      return {
        verse,
        translation,
        response: verseText,
        success: true,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      
      return {
        verse,
        translation,
        response: '',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Method to update the model (for switching between Haiku, Sonnet, etc.)
  updateModel(model: ClaudeConfig['model']) {
    this.config.model = model;
  }

  // Method to update the API key
  updateApiKey(apiKey: string) {
    this.config.apiKey = apiKey;
  }

  getCurrentModel(): string {
    return this.config.model;
  }
}

// Default configuration - can be overridden
export const createClaudeService = (apiKey: string, model: ClaudeConfig['model'] = 'claude-3-haiku-20240307') => {
  return new ClaudeService({
    apiKey,
    model,
    baseUrl: 'https://api.anthropic.com/v1/messages',
  });
};