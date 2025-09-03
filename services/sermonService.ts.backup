import authService from './authService';
import seriesService from './seriesService';

// Shape used by the editor and containers (lightweight)
export interface SermonDto {
  id: number;
  documentId: string;
  title: string;
  content?: string;
  outline?: any;
  scripture?: string;
  tags?: string[];
  status?: 'draft' | 'preparing' | 'ready' | 'delivered' | 'archived';
  visibility?: 'private' | 'congregation' | 'public';
  date?: string; // ISO string
  notes?: string;
  series?: { id?: number; documentId?: string } | null;
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
  seriesId?: number; // optional relation by numeric id
  notes?: string;
}

export interface UpdateSermonInput extends Partial<CreateSermonInput> {}

class SermonService {
  private base = '/sermons';

  private serialize(item: any): SermonDto {
    const src = item?.attributes ? item.attributes : item;
    return {
      id: item?.id,
      documentId: item?.documentId ?? src?.documentId,
      title: src?.title,
      content: src?.content,
      outline: src?.outline,
      scripture: src?.scripture,
      tags: src?.tags || [],
      status: src?.status,
      visibility: src?.visibility,
      date: src?.date,
      notes: src?.notes,
      series: src?.series || null,
    };
  }

  async getByDocumentId(documentId: string): Promise<SermonDto> {
    const res = await authService.makeAuthenticatedRequest(`${this.base}/${documentId}?populate=*`);
    if (!res.ok) throw new Error(`Failed to fetch sermon (${res.status})`);
    const json = await res.json();
    return this.serialize(json.data);
  }

  async listMine(): Promise<SermonDto[]> {
    // Try custom endpoint first
    let res = await authService.makeAuthenticatedRequest(`${this.base}/mine?populate=series`);
    if (res.ok) {
      const json = await res.json();
      return (json.data || []).map((it: any) => this.serialize(it));
    }

    // Fallback: fetch page and filter client-side (less ideal)
    res = await authService.makeAuthenticatedRequest(`${this.base}?pagination[pageSize]=100&populate=series`);
    if (!res.ok) throw new Error(`Failed to fetch sermons (HTTP ${res.status})`);
    const json = await res.json();
    const items = (json.data || []).map((it: any) => this.serialize(it));
    const me = await authService.getUser();
    return items.filter((s) => (s as any)?.user?.id === (me as any)?.id || (s as any)?.user?.data?.id === (me as any)?.id);
  }

  async create(input: CreateSermonInput): Promise<SermonDto> {
    const currentUser = await authService.getUser();
    if (!currentUser) throw new Error('No authenticated user');

    let seriesId: number | undefined = input.seriesId;
    if (!seriesId && input.seriesDocumentId) {
      try {
        const series = await seriesService.getSeriesById(input.seriesDocumentId);
        seriesId = series?.id;
      } catch (_) {
        // ignore if not resolvable
      }
    }

    const body = {
      data: {
        title: input.title,
        content: input.content ?? '',
        outline: input.outline ?? '',
        scripture: input.scripture ?? '',
        tags: input.tags ?? [],
        status: input.status ?? 'draft',
        visibility: input.visibility ?? 'private',
        date: input.date ?? undefined,
        notes: input.notes ?? '',
        ...(seriesId ? { series: seriesId } : {}),
      },
    };

    const res = await authService.makeAuthenticatedRequest(this.base, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let err = 'Failed to create sermon';
      try { const j = await res.json(); err = j?.error?.message || err; } catch {}
      throw new Error(err);
    }
    const json = await res.json();
    return this.serialize(json.data);
  }

  async update(documentId: string, input: UpdateSermonInput): Promise<SermonDto> {
    let seriesId: number | undefined = undefined;
    if (input.seriesDocumentId) {
      try {
        const series = await seriesService.getSeriesById(input.seriesDocumentId);
        seriesId = series?.id;
      } catch (_) {}
    }

    const body: any = { data: { ...input } };
    if (seriesId) {
      body.data.series = seriesId;
      delete body.data.seriesDocumentId;
    }

    const res = await authService.makeAuthenticatedRequest(`${this.base}/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let err = 'Failed to update sermon';
      try { const j = await res.json(); err = j?.error?.message || err; } catch {}
      throw new Error(err);
    }
    const json = await res.json();
    return this.serialize(json.data);
  }
}

export default new SermonService();
