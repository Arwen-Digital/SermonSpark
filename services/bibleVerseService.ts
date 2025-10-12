import { createClaudeService, ClaudeService } from './claudeService';
import { agentSearchRepository } from './repositories';
import { BibleVerseSearch, AgentSearch } from '@/types';

export class BibleVerseService {
  private claudeService: ClaudeService;
  private userId: string;

  constructor(apiKey: string, userId: string, model: 'claude-3-haiku-20240307' | 'claude-3-sonnet-20240229' | 'claude-3-opus-20240229' = 'claude-3-haiku-20240307') {
    this.claudeService = createClaudeService(apiKey, model);
    this.userId = userId;
  }

  async searchVerse(verse: string, translation: string): Promise<BibleVerseSearch> {
    const startTime = Date.now();
    
    try {
      // Search for the verse using Claude
      const result = await this.claudeService.searchBibleVerse(verse, translation);
      
      const responseTimeMs = Date.now() - startTime;

      // Log the search to the database
      await this.logSearch({
        userId: this.userId,
        agentType: this.claudeService.getCurrentModel().includes('haiku') ? 'claude_haiku' : 
                   this.claudeService.getCurrentModel().includes('sonnet') ? 'claude_sonnet' : 'claude_opus',
        searchType: 'bible_verse',
        query: `Search for Bible verse: ${verse} ${translation}`,
        response: result.response,
        metadata: {
          verse,
          translation,
          originalQuery: verse,
        },
        success: result.success,
        errorMessage: result.errorMessage,
        responseTimeMs,
        // Note: Claude API doesn't provide token usage in the response format we're using
        // You might need to implement a different approach to get token usage
      });

      return result;
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      
      // Log the failed search
      await this.logSearch({
        userId: this.userId,
        agentType: this.claudeService.getCurrentModel().includes('haiku') ? 'claude_haiku' : 
                   this.claudeService.getCurrentModel().includes('sonnet') ? 'claude_sonnet' : 'claude_opus',
        searchType: 'bible_verse',
        query: `Search for Bible verse: ${verse} ${translation}`,
        response: '',
        metadata: {
          verse,
          translation,
          originalQuery: verse,
        },
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
        responseTimeMs,
      });

      return {
        verse,
        translation,
        response: '',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async logSearch(searchData: Omit<AgentSearch, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'op' | 'version'>) {
    try {
      await agentSearchRepository.create(searchData);
    } catch (error) {
      console.error('Failed to log agent search:', error);
      // Don't throw here - we don't want to break the main functionality
    }
  }

  // Method to update the Claude model
  updateModel(model: 'claude-3-haiku-20240307' | 'claude-3-sonnet-20240229' | 'claude-3-opus-20240229') {
    this.claudeService.updateModel(model);
  }

  // Method to update the API key
  updateApiKey(apiKey: string) {
    this.claudeService.updateApiKey(apiKey);
  }

  getCurrentModel(): string {
    return this.claudeService.getCurrentModel();
  }
}

// Factory function to create a Bible verse service
export const createBibleVerseService = (
  apiKey: string, 
  userId: string, 
  model: 'claude-3-haiku-20240307' | 'claude-3-sonnet-20240229' | 'claude-3-opus-20240229' = 'claude-3-haiku-20240307'
) => {
  return new BibleVerseService(apiKey, userId, model);
};