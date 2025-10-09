import AsyncStorage from '@react-native-async-storage/async-storage';

// Shape used by the editor and containers (lightweight) - keeping same interface
export interface SermonDto {
  id: string;
  documentId: string;  // For compatibility, same as id
  title: string;
  content?: string;
  outline?: any;
  scripture?: string;
  tags?: string[];
  status?: 'draft' | 'preparing' | 'ready' | 'delivered' | 'archived';
  visibility?: 'private' | 'congregation' | 'public';
  date?: string; // ISO string
  notes?: string;
  series?: { id?: string; documentId?: string; title?: string } | null;
}

export interface CreateSermonInput {
  title: string;
  content?: string;
  outline?: any;
  scripture?: string;
  tags?: string[];
  status?: SermonDto['status'];
  visibility?: SermonDto['visibility'];
  date?: string; // YYYY-MM-DD or ISO
  seriesDocumentId?: string; // optional relation by documentId
  seriesId?: string; // optional relation by UUID
  notes?: string;
}

export interface UpdateSermonInput extends Partial<CreateSermonInput> {}

class ExpressSermonService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.EXPO_PUBLIC_EXPRESS_API_URL || 'http://localhost:3000';
  }

  private async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getToken();
    const url = `${this.baseUrl}/api${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || data.message || 'Request failed');
    }

    return data.data || data;
  }

  private serialize(item: any): SermonDto {
    return {
      id: item.id,
      documentId: item.id, // Same as id for compatibility
      title: item.title,
      content: item.content,
      outline: item.outline,
      scripture: item.scripture,
      tags: item.tags || [],
      status: item.status || 'draft',
      visibility: item.visibility || 'private',
      date: item.date,
      notes: item.notes,
      series: item.series ? { 
        id: item.series.id, 
        documentId: item.series.id, 
        title: item.series.title 
      } : null,
    };
  }

  async getByDocumentId(documentId: string): Promise<SermonDto> {
    try {
      const response = await this.makeRequest(`/sermons/${documentId}`);
      const data = await this.handleResponse<any>(response);
      return this.serialize(data);
    } catch (error) {
      console.error('Get sermon by ID error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch sermon: ${error.message}`);
      }
      throw new Error('Network error during sermon fetch');
    }
  }

  async listMine(): Promise<SermonDto[]> {
    try {
      const response = await this.makeRequest('/sermons');
      const result = await this.handleResponse<{ sermons: any[] }>(response);
      return result.sermons.map((item: any) => this.serialize(item));
    } catch (error) {
      console.error('List sermons error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch sermons: ${error.message}`);
      }
      throw new Error('Network error during sermons fetch');
    }
  }

  async create(input: CreateSermonInput): Promise<SermonDto> {
    try {
      // Transform field names to match Express.js API
      const requestData: any = {
        title: input.title,
        content: input.content,
        outline: input.outline,
        scripture: input.scripture,
        tags: input.tags,
        status: input.status || 'draft',
        visibility: input.visibility || 'private',
        date: input.date,
        notes: input.notes,
      };

      // Add series_id if provided (Express.js uses series_id, not seriesId)
      if (input.seriesId || input.seriesDocumentId) {
        requestData.series_id = input.seriesId || input.seriesDocumentId;
      }

      const response = await this.makeRequest('/sermons', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      const data = await this.handleResponse<any>(response);
      return this.serialize(data);
    } catch (error) {
      console.error('Create sermon error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create sermon: ${error.message}`);
      }
      throw new Error('Network error during sermon creation');
    }
  }

  async update(documentId: string, input: UpdateSermonInput): Promise<SermonDto> {
    try {
      // Transform field names to match Express.js API
      const requestData: any = {};
      if (input.title !== undefined) requestData.title = input.title;
      if (input.content !== undefined) requestData.content = input.content;
      if (input.outline !== undefined) requestData.outline = input.outline;
      if (input.scripture !== undefined) requestData.scripture = input.scripture;
      if (input.tags !== undefined) requestData.tags = input.tags;
      if (input.status !== undefined) requestData.status = input.status;
      if (input.visibility !== undefined) requestData.visibility = input.visibility;
      if (input.date !== undefined) requestData.date = input.date;
      if (input.notes !== undefined) requestData.notes = input.notes;
      
      // Handle series relationship (Express.js uses series_id, not seriesId)
      if (input.seriesId !== undefined || input.seriesDocumentId !== undefined) {
        requestData.series_id = input.seriesId || input.seriesDocumentId;
      }

      const response = await this.makeRequest(`/sermons/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify(requestData),
      });

      const data = await this.handleResponse<any>(response);
      return this.serialize(data);
    } catch (error) {
      console.error('Update sermon error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update sermon: ${error.message}`);
      }
      throw new Error('Network error during sermon update');
    }
  }

  async delete(documentId: string): Promise<void> {
    try {
      const response = await this.makeRequest(`/sermons/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete sermon error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to delete sermon: ${error.message}`);
      }
      throw new Error('Network error during sermon deletion');
    }
  }
}

export default new ExpressSermonService();