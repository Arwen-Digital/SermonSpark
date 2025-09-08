import { supabase } from './supabaseClient';

// Shape used by the editor and containers (lightweight) - keeping same interface
export interface SermonDto {
  id: string;  // Changed to string (UUID)
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

class SupabaseSermonService {
  private serialize(item: any): SermonDto {
    return {
      id: item.id,
      documentId: item.id, // Same as id for compatibility
      title: item.title,
      content: item.content,
      outline: item.outline,
      scripture: item.scripture,
      tags: item.tags || [],
      status: item.status,
      visibility: item.visibility,
      date: item.date,
      notes: item.notes,
      series: item.series ? { id: item.series.id, documentId: item.series.id, title: item.series.title } : null,
    };
  }

  async getByDocumentId(documentId: string): Promise<SermonDto> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('sermons')
      .select(`
        *,
        series (
          id,
          title
        )
      `)
      .eq('id', documentId)
      .is('deleted_at', null)
      .eq('user_id', user.id)
      .single();

    if (error) throw new Error(`Failed to fetch sermon: ${error.message}`);
    return this.serialize(data);
  }

  async listMine(): Promise<SermonDto[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('sermons')
      .select(`
        *,
        series (
          id,
          title
        )
      `)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch sermons: ${error.message}`);
    return (data || []).map((item: any) => this.serialize(item));
  }

  async create(input: CreateSermonInput): Promise<SermonDto> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Handle series relationship
    let seriesId: string | null = null;
    if (input.seriesId) {
      seriesId = input.seriesId;
    } else if (input.seriesDocumentId) {
      // For compatibility, treat seriesDocumentId as seriesId
      seriesId = input.seriesDocumentId;
    }

    const insertData = {
      title: input.title,
      content: input.content || null,
      outline: input.outline || null,
      scripture: input.scripture || null,
      tags: input.tags || [],
      status: input.status || 'draft',
      visibility: input.visibility || 'private',
      date: input.date ? new Date(input.date).toISOString() : null,
      notes: input.notes || null,
      user_id: user.id,
      series_id: seriesId,
    };

    const { data, error } = await supabase
      .from('sermons')
      .insert(insertData)
      .select(`
        *,
        series (
          id,
          title
        )
      `)
      .single();

    if (error) throw new Error(`Failed to create sermon: ${error.message}`);
    return this.serialize(data);
  }

  async update(documentId: string, input: UpdateSermonInput): Promise<SermonDto> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Handle series relationship
    let seriesId: string | null | undefined = undefined;
    if (input.seriesId !== undefined) {
      seriesId = input.seriesId;
    } else if (input.seriesDocumentId !== undefined) {
      seriesId = input.seriesDocumentId;
    }

    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.outline !== undefined) updateData.outline = input.outline;
    if (input.scripture !== undefined) updateData.scripture = input.scripture;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.visibility !== undefined) updateData.visibility = input.visibility;
    if (input.date !== undefined) updateData.date = input.date ? new Date(input.date).toISOString() : null;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (seriesId !== undefined) updateData.series_id = seriesId;

    const { data, error } = await supabase
      .from('sermons')
      .update(updateData)
      .eq('id', documentId)
      .eq('user_id', user.id)
      .select(`
        *,
        series (
          id,
          title
        )
      `)
      .single();

    if (error) throw new Error(`Failed to update sermon: ${error.message}`);
    return this.serialize(data);
  }

  async delete(documentId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { error } = await supabase
      .from('sermons')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', documentId)
      .eq('user_id', user.id);

    if (error) throw new Error(`Failed to delete sermon: ${error.message}`);
  }
}

export default new SupabaseSermonService();
