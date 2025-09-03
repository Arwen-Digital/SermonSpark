import { supabase } from './supabaseClient';

export interface Series {
  id: string;  // Changed to string (UUID)
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
  id?: string;  // Changed to string
}

class SupabaseSeriesService {
  private serialize(item: any): Series {
    return {
      id: item.id,
      documentId: item.id, // Same as id for compatibility
      title: item.title,
      description: item.description,
      startDate: item.start_date,
      endDate: item.end_date,
      image: item.image,
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('series')
      .select(`
        *,
        sermons (
          id,
          title,
          status
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch series: ${error.message}`);
    return (data || []).map((item: any) => this.serialize(item));
  }

  // Get a single series by ID
  async getSeriesById(documentId: string): Promise<Series> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('series')
      .select(`
        *,
        sermons (
          id,
          title,
          status,
          created_at
        )
      `)
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new Error('Series not found');
      throw new Error(`Failed to fetch series: ${error.message}`);
    }
    
    return this.serialize(data);
  }

  // Create a new series
  async createSeries(seriesData: CreateSeriesData): Promise<Series> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const insertData = {
      title: seriesData.title,
      description: seriesData.description || null,
      start_date: seriesData.startDate || null,
      end_date: seriesData.endDate || null,
      tags: seriesData.tags || [],
      status: seriesData.status || 'planning',
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('series')
      .insert(insertData)
      .select(`
        *,
        sermons (
          id,
          title,
          status
        )
      `)
      .single();

    if (error) throw new Error(`Failed to create series: ${error.message}`);
    return this.serialize(data);
  }

  // Update an existing series
  async updateSeries(documentId: string, updateData: UpdateSeriesData): Promise<Series> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const updateFields: any = {};
    if (updateData.title !== undefined) updateFields.title = updateData.title;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.startDate !== undefined) updateFields.start_date = updateData.startDate;
    if (updateData.endDate !== undefined) updateFields.end_date = updateData.endDate;
    if (updateData.tags !== undefined) updateFields.tags = updateData.tags;
    if (updateData.status !== undefined) updateFields.status = updateData.status;

    const { data, error } = await supabase
      .from('series')
      .update(updateFields)
      .eq('id', documentId)
      .eq('user_id', user.id)
      .select(`
        *,
        sermons (
          id,
          title,
          status
        )
      `)
      .single();

    if (error) throw new Error(`Failed to update series: ${error.message}`);
    return this.serialize(data);
  }

  // Delete a series
  async deleteSeries(documentId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { error } = await supabase
      .from('series')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id);

    if (error) throw new Error(`Failed to delete series: ${error.message}`);
  }

  // Get series with sermon count
  async getSeriesWithSermonCount(): Promise<(Series & { sermonCount: number })[]> {
    const series = await this.getAllSeries();
    
    return series.map(s => ({
      ...s,
      sermonCount: s.sermons?.length || 0
    }));
  }

  // Get active series (status = 'active')
  async getActiveSeries(): Promise<Series[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('series')
      .select(`
        *,
        sermons (
          id,
          title,
          status
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('start_date', { ascending: false });

    if (error) throw new Error(`Failed to fetch active series: ${error.message}`);
    return (data || []).map((item: any) => this.serialize(item));
  }
}

export default new SupabaseSeriesService();