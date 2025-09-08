import supabaseSermonService, { type CreateSermonInput as SupaCreate, type UpdateSermonInput as SupaUpdate, type SermonDto } from '../supabaseSermonService';
import type { SermonRepository, SermonDTO, CreateSermonInput, UpdateSermonInput } from './types';

function toDTO(s: SermonDto): SermonDTO {
  return {
    id: s.id,
    title: s.title,
    content: s.content ?? null,
    outline: s.outline ?? null,
    scripture: s.scripture ?? null,
    tags: s.tags ?? [],
    status: s.status,
    visibility: s.visibility,
    date: s.date ?? null,
    notes: s.notes ?? null,
    seriesId: s.series?.id ?? null,
    seriesTitle: s.series?.title ?? null,
  };
}

function fromCreate(input: CreateSermonInput): SupaCreate {
  return {
    title: input.title,
    content: input.content,
    outline: input.outline,
    scripture: input.scripture,
    tags: input.tags,
    status: input.status,
    visibility: input.visibility,
    date: input.date,
    notes: input.notes,
    seriesId: input.seriesId,
  };
}

function fromUpdate(input: UpdateSermonInput): SupaUpdate {
  return {
    title: input.title,
    content: input.content,
    outline: input.outline,
    scripture: input.scripture,
    tags: input.tags,
    status: input.status,
    visibility: input.visibility,
    date: input.date,
    notes: input.notes,
    seriesId: input.seriesId,
  };
}

export const sermonRepository: SermonRepository = {
  async list() {
    const data = await supabaseSermonService.listMine();
    return data.map(toDTO);
  },
  async get(id: string) {
    const data = await supabaseSermonService.getByDocumentId(id);
    return toDTO(data);
  },
  async create(input: CreateSermonInput) {
    const res = await supabaseSermonService.create(fromCreate(input));
    return toDTO(res);
  },
  async update(id: string, input: UpdateSermonInput) {
    const res = await supabaseSermonService.update(id, fromUpdate(input));
    return toDTO(res);
  },
  async remove(id: string) {
    await supabaseSermonService.delete(id);
  },
  async sync() {
    // No-op on web; web always hits Supabase directly
  },
};

export default sermonRepository;

