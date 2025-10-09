import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Series {
  id: string;
  documentId: string;  // For compatibility, same as id
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  image?: any;
  tags?: string[];
  status: 'planning' | 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  user?: any;
  sermons?: any[];
}

export interface CreateSeriesData {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  status?: 'planning' | 'active' | 'completed' | 'archived';
}

export interface UpdateSeriesData extends Partial<CreateSeriesData> {
  id?: string;
}

class ExpressSeriesService {
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

  private serialize(item: any): Series {
    return {
      id: item.id,
      documentId: item.id, // Same as id for compatibility
      title: item.title,
      description: item.description,
      startDate: item.start_date,
      endDate: item.end_date,
      image: item.image_url ? { url: item.image_url } : null,
      tags: item.tags || [],
      status: item.status || 'planning',
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      publishedAt: item.created_at, // For compatibility
      user: { id: item.user_id },
      sermons: item.sermons || [],
    } as Series;
  }

  // Get all series for the current user
  async getAllSeries(): Promise<Series[]> {
    try {
      const response = await this.makeRequest('/series');
      const result = await this.handleResponse<{ series: any[] }>(response);
      return result.series.map((item: any) => this.serialize(item));
    } catch (error) {
      console.error('Get all series error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch series: ${error.message}`);
      }
      throw new Error('Network error during series fetch');
    }
  }

  // Get a single series by ID
  async getSeriesById(documentId: string): Promise<Series> {
    try {
      const response = await this.makeRequest(`/series/${documentId}`);
      const data = await this.handleResponse<any>(response);
      return this.serialize(data);
    } catch (error) {
      console.error('Get series by ID error:', error);
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('404')) {
          throw new Error('Series not found');
        }
        throw new Error(`Failed to fetch series: ${error.message}`);
      }
      throw new Error('Network error during series fetch');
    }
  }

  // Create a new series
  async createSeries(seriesData: CreateSeriesData): Promise<Series> {
    try {
      // Transform field names to match Express.js API
      const requestData = {
        title: seriesData.title,
        description: seriesData.description,
        start_date: seriesData.startDate,
        end_date: seriesData.endDate,
        tags: seriesData.tags,
        status: seriesData.status || 'planning'
      };

      const response = await this.makeRequest('/series', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      const data = await this.handleResponse<any>(response);
      return this.serialize(data);
    } catch (error) {
      console.error('Create series error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create series: ${error.message}`);
      }
      throw new Error('Network error during series creation');
    }
  }

  // Update an existing series
  async updateSeries(documentId: string, updateData: UpdateSeriesData): Promise<Series> {
    try {
      // Transform field names to match Express.js API
      const requestData: any = {};
      if (updateData.title !== undefined) requestData.title = updateData.title;
      if (updateData.description !== undefined) requestData.description = updateData.description;
      if (updateData.startDate !== undefined) requestData.start_date = updateData.startDate;
      if (updateData.endDate !== undefined) requestData.end_date = updateData.endDate;
      if (updateData.tags !== undefined) requestData.tags = updateData.tags;
      if (updateData.status !== undefined) requestData.status = updateData.status;

      const response = await this.makeRequest(`/series/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify(requestData),
      });

      const data = await this.handleResponse<any>(response);
      return this.serialize(data);
    } catch (error) {
      console.error('Update series error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update series: ${error.message}`);
      }
      throw new Error('Network error during series update');
    }
  }

  // Delete a series
  async deleteSeries(documentId: string): Promise<void> {
    try {
      const response = await this.makeRequest(`/series/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete series error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to delete series: ${error.message}`);
      }
      throw new Error('Network error during series deletion');
    }
  }

  // Get series with sermon count
  async getSeriesWithSermonCount(): Promise<(Series & { sermonCount: number })[]> {
    try {
      const series = await this.getAllSeries();
      
      return series.map(s => ({
        ...s,
        sermonCount: s.sermons?.length || 0
      }));
    } catch (error) {
      console.error('Get series with sermon count error:', error);
      throw error;
    }
  }

  // Get active series (status = 'active')
  async getActiveSeries(): Promise<Series[]> {
    try {
      const response = await this.makeRequest('/series/active');
      const result = await this.handleResponse<{ series: any[] }>(response);
      return result.series.map((item: any) => this.serialize(item));
    } catch (error) {
      console.error('Get active series error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch active series: ${error.message}`);
      }
      throw new Error('Network error during active series fetch');
    }
  }
}

export default new ExpressSeriesService();