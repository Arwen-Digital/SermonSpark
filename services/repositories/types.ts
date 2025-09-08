// Repository-level DTOs used by both native (SQLite) and web (Supabase).

export type SeriesStatus = 'planning' | 'active' | 'completed' | 'archived';
export type SermonStatus = 'draft' | 'preparing' | 'ready' | 'delivered' | 'archived';
export type SermonVisibility = 'private' | 'congregation' | 'public';

export interface SeriesDTO {
  id: string;
  userId?: string; // present in native; implied in web
  title: string;
  description?: string | null;
  startDate?: string | null; // ISO
  endDate?: string | null;   // ISO
  imageUrl?: string | null;
  tags?: string[];
  status: SeriesStatus;
  createdAt?: string;
  updatedAt?: string;
  // convenience
  sermonCount?: number;
}

export interface CreateSeriesInput {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  status?: SeriesStatus;
  imageUrl?: string | null;
}

export type UpdateSeriesInput = Partial<CreateSeriesInput>;

export interface SermonDTO {
  id: string;
  userId?: string; // present in native; implied in web
  title: string;
  content?: string | null;
  outline?: unknown | null; // JSON
  scripture?: string | null;
  tags?: string[];
  status?: SermonStatus;
  visibility?: SermonVisibility;
  date?: string | null; // ISO
  notes?: string | null;
  seriesId?: string | null;
  seriesTitle?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSermonInput {
  title: string;
  content?: string;
  outline?: unknown;
  scripture?: string;
  tags?: string[];
  status?: SermonStatus;
  visibility?: SermonVisibility;
  date?: string; // ISO
  notes?: string;
  seriesId?: string; // optional
}

export type UpdateSermonInput = Partial<CreateSermonInput>;

// Common repository interface both platforms implement
export interface SeriesRepository {
  list(): Promise<SeriesDTO[]>;
  get(id: string): Promise<SeriesDTO>;
  create(input: CreateSeriesInput): Promise<SeriesDTO>;
  update(id: string, input: UpdateSeriesInput): Promise<SeriesDTO>;
  remove(id: string): Promise<void>;
  // Native may implement; web returns resolved Promise
  sync?(): Promise<void>;
}

export interface SermonRepository {
  list(): Promise<SermonDTO[]>;
  get(id: string): Promise<SermonDTO>;
  create(input: CreateSermonInput): Promise<SermonDTO>;
  update(id: string, input: UpdateSermonInput): Promise<SermonDTO>;
  remove(id: string): Promise<void>;
  sync?(): Promise<void>;
}

