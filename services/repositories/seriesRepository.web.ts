import supabaseSeriesService, { type CreateSeriesData, type UpdateSeriesData } from '../supabaseSeriesService';
import type { SeriesRepository, SeriesDTO, CreateSeriesInput, UpdateSeriesInput } from './types';

function toDTO(s: any): SeriesDTO {
  return {
    id: s.id,
    title: s.title,
    description: s.description ?? null,
    startDate: s.startDate ?? null,
    endDate: s.endDate ?? null,
    imageUrl: s.image?.url ?? s.image ?? null,
    tags: s.tags ?? [],
    status: s.status,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    sermonCount: Array.isArray(s.sermons) ? s.sermons.length : undefined,
  };
}

function fromCreate(input: CreateSeriesInput): CreateSeriesData {
  return {
    title: input.title,
    description: input.description,
    startDate: input.startDate,
    endDate: input.endDate,
    tags: input.tags,
    status: input.status,
  };
}

function fromUpdate(input: UpdateSeriesInput): UpdateSeriesData {
  return {
    title: input.title,
    description: input.description,
    startDate: input.startDate,
    endDate: input.endDate,
    tags: input.tags,
    status: input.status,
  };
}

export const seriesRepository: SeriesRepository = {
  async list() {
    const data = await supabaseSeriesService.getAllSeries();
    return data.map(toDTO);
  },
  async get(id: string) {
    const data = await supabaseSeriesService.getSeriesById(id);
    return toDTO(data);
  },
  async create(input: CreateSeriesInput) {
    const res = await supabaseSeriesService.createSeries(fromCreate(input));
    return toDTO(res);
  },
  async update(id: string, input: UpdateSeriesInput) {
    const res = await supabaseSeriesService.updateSeries(id, fromUpdate(input));
    return toDTO(res);
  },
  async remove(id: string) {
    await supabaseSeriesService.deleteSeries(id);
  },
  async sync() {
    // No-op on web; web always hits Supabase directly
  },
};

export default seriesRepository;

