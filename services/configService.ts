import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ClaudeConfig {
  apiKey: string;
  model: 'claude-3-haiku-20240307' | 'claude-3-sonnet-20240229' | 'claude-3-opus-20240229';
  enabled: boolean;
}

const CONFIG_KEYS = {
  CLAUDE_API_KEY: 'claude_api_key',
  CLAUDE_MODEL: 'claude_model',
  CLAUDE_ENABLED: 'claude_enabled',
} as const;

export class ConfigService {
  async getClaudeConfig(): Promise<ClaudeConfig> {
    try {
      const [apiKey, model, enabled] = await Promise.all([
        AsyncStorage.getItem(CONFIG_KEYS.CLAUDE_API_KEY),
        AsyncStorage.getItem(CONFIG_KEYS.CLAUDE_MODEL),
        AsyncStorage.getItem(CONFIG_KEYS.CLAUDE_ENABLED),
      ]);

      return {
        apiKey: apiKey || process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '',
        model: (model as ClaudeConfig['model']) || 'claude-3-haiku-20240307',
        enabled: enabled === 'true' || !!process.env.EXPO_PUBLIC_CLAUDE_API_KEY,
      };
    } catch (error) {
      console.error('Error loading Claude config:', error);
      return {
        apiKey: process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '',
        model: 'claude-3-haiku-20240307',
        enabled: !!process.env.EXPO_PUBLIC_CLAUDE_API_KEY,
      };
    }
  }

  async setClaudeApiKey(apiKey: string): Promise<void> {
    try {
      await AsyncStorage.setItem(CONFIG_KEYS.CLAUDE_API_KEY, apiKey);
    } catch (error) {
      console.error('Error saving Claude API key:', error);
      throw error;
    }
  }

  async setClaudeModel(model: ClaudeConfig['model']): Promise<void> {
    try {
      await AsyncStorage.setItem(CONFIG_KEYS.CLAUDE_MODEL, model);
    } catch (error) {
      console.error('Error saving Claude model:', error);
      throw error;
    }
  }

  async setClaudeEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(CONFIG_KEYS.CLAUDE_ENABLED, enabled.toString());
    } catch (error) {
      console.error('Error saving Claude enabled state:', error);
      throw error;
    }
  }

  async clearClaudeConfig(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(CONFIG_KEYS.CLAUDE_API_KEY),
        AsyncStorage.removeItem(CONFIG_KEYS.CLAUDE_MODEL),
        AsyncStorage.removeItem(CONFIG_KEYS.CLAUDE_ENABLED),
      ]);
    } catch (error) {
      console.error('Error clearing Claude config:', error);
      throw error;
    }
  }
}

export const configService = new ConfigService();