import authService from './authService';

export interface Series {
  id: number;
  documentId: string;
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
  id?: number;
}

class SeriesService {
  private seriesBasePath: string | null = null;

  private async detectSeriesBasePath(): Promise<string> {
    // Pin to the schema-defined pluralName: 'series-list'
    if (!this.seriesBasePath) this.seriesBasePath = '/series-list';
    return this.seriesBasePath;
  }

  private async seriesRequest(query: string, options?: RequestInit) {
    const base = await this.detectSeriesBasePath();
    return authService.makeAuthenticatedRequest(`${base}${query}`, options);
  }
  
  private buildListQueries(params: {
    userId?: number;
    userDocumentId?: string | number;
    activeOnly?: boolean;
    sortField?: string;
  }): string[] {
    const filtersActive = params.activeOnly ? '&filters[status][$eq]=active' : '';
    const sort = params.sortField ? `&sort=${params.sortField}:desc` : '';

    const populateCandidates = [
      'populate[user]=true&populate[sermons]=true',
      'populate[user]=true',
      ''
    ];

    const userFilterCandidates = [
      params.userDocumentId != null
        ? `filters[user][documentId][$eq]=${params.userDocumentId}`
        : null,
      params.userDocumentId != null
        ? `filters[user][documentId]=${params.userDocumentId}`
        : null,
      params.userId != null
        ? `filters[user][id][$eq]=${params.userId}`
        : null,
      params.userId != null
        ? `filters[user][id]=${params.userId}`
        : null,
      params.userId != null
        ? `filters[user][$eq]=${params.userId}`
        : null,
      params.userId != null
        ? `filters[user]=${params.userId}`
        : null,
    ].filter(Boolean) as string[];

    const queries: string[] = [];
    // Try minimal first (helps bypass strict filter/populate setups)
    queries.push('?');
    // Then minimal with sort/active
    queries.push(`?${filtersActive}${sort}`);

    for (const userFilter of userFilterCandidates) {
      for (const pop of populateCandidates) {
        const popPart = pop ? `&${pop}` : '';
        queries.push(`?${userFilter}${popPart}${filtersActive}${sort}`);
      }
    }
    return queries;
  }
  private serialize(item: any): Series {
    // Support both Strapi v4 (attributes wrapper) and v5 (flat) shapes
    const src = item?.attributes ? item.attributes : item;
    const userRel = src?.user ?? item?.user;
    const sermonsRel = src?.sermons ?? item?.sermons;

    return {
      id: item?.id,
      documentId: item?.documentId ?? src?.documentId ?? String(item?.id),
      title: src?.title,
      description: src?.description,
      startDate: src?.startDate,
      endDate: src?.endDate,
      image: src?.image,
      tags: src?.tags || [],
      status: src?.status,
      createdAt: src?.createdAt,
      updatedAt: src?.updatedAt,
      publishedAt: src?.publishedAt,
      user: userRel,
      sermons: Array.isArray(sermonsRel?.data) ? sermonsRel.data : (sermonsRel || []),
    } as Series;
  }

  // In Strapi v5, findOne/update/delete use documentId in the path
  // Keeping resolver removed to avoid numeric id usage which 404s on v5

  // Get all series for the current user
  async getAllSeries(): Promise<Series[]> {
    try {
      let currentUser = await authService.getUser();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      const base = await this.detectSeriesBasePath();

      // First try the custom endpoint provided by our Strapi API
      const mineRes = await authService.makeAuthenticatedRequest(`${base}/mine`);
      if (mineRes.ok) {
        const data = await mineRes.json();
        const items = data?.data || [];
        return items.map((it: any) => this.serialize(it));
      }

      // Fallback: fetch all, populate if possible, then filter client-side
      const fallbackRes = await this.seriesRequest('?populate=*&sort=createdAt:desc&pagination[pageSize]=100');
      if (!fallbackRes.ok) {
        throw new Error(`Failed to fetch series (HTTP ${fallbackRes.status})`);
      }
      const fallbackData = await fallbackRes.json();
      const mapped = (fallbackData?.data || []).map((it: any) => this.serialize(it));
      return mapped.filter((s: any) => {
        const uid = s?.user?.data?.id ?? s?.user?.id ?? (typeof s?.user === 'number' ? s.user : undefined);
        return uid === (currentUser as any)?.id;
      });
    } catch (error) {
      console.error('Get all series error:', error);
      throw error;
    }
  }

  // Get a single series by ID
  async getSeriesById(documentId: string): Promise<Series> {
    try {
      const response = await this.seriesRequest(
        `?filters[documentId][$eq]=${documentId}&populate[user]=true&populate[sermons]=true`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch series');
      }

      const data = await response.json();
      const entity = data?.data?.[0];
      if (!entity) throw new Error('Series not found');
      return this.serialize(entity);
    } catch (error) {
      console.error('Get series by ID error:', error);
      throw error;
    }
  }

  // Create a new series
  async createSeries(seriesData: CreateSeriesData): Promise<Series> {
    try {
      const currentUser = await authService.getUser();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      const base = await this.detectSeriesBasePath();
      const response = await authService.makeAuthenticatedRequest(base, {
        method: 'POST',
        body: JSON.stringify({
          data: {
            ...seriesData,
            user: currentUser.id,
            status: seriesData.status || 'planning'
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create series');
      }

      const data = await response.json();
      console.log('Series created successfully:', data.data);
      return this.serialize(data.data);
    } catch (error) {
      console.error('Create series error:', error);
      throw error;
    }
  }

  // Update an existing series
  async updateSeries(documentId: string, updateData: UpdateSeriesData): Promise<Series> {
    try {
      const base = await this.detectSeriesBasePath();
      const response = await authService.makeAuthenticatedRequest(`${base}/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          data: updateData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update series');
      }

      const data = await response.json();
      console.log('Series updated successfully:', data.data);
      return this.serialize(data.data);
    } catch (error) {
      console.error('Update series error:', error);
      throw error;
    }
  }

  // Delete a series
  async deleteSeries(documentId: string): Promise<void> {
    try {
      const base = await this.detectSeriesBasePath();
      const response = await authService.makeAuthenticatedRequest(`${base}/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete series');
      }

      console.log('Series deleted successfully');
    } catch (error) {
      console.error('Delete series error:', error);
      throw error;
    }
  }

  // Get series with sermon count
  async getSeriesWithSermonCount(): Promise<(Series & { sermonCount: number })[]> {
    try {
      const series = await this.getAllSeries();
      
      // For each series, count the sermons (if populated) or make a separate call
      const seriesWithCount = series.map(s => ({
        ...s,
        sermonCount: s.sermons?.length || 0
      }));

      return seriesWithCount;
    } catch (error) {
      console.error('Get series with sermon count error:', error);
      throw error;
    }
  }

  // Get active series (status = 'active')
  async getActiveSeries(): Promise<Series[]> {
    try {
      let currentUser = await authService.getUser();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      if (!(currentUser as any).documentId) {
        try {
          currentUser = await authService.getCurrentUser();
        } catch (_) {
          // continue with stored user
        }
      }

      const queries = this.buildListQueries({
        userId: (currentUser as any)?.id,
        userDocumentId: (currentUser as any)?.documentId,
        activeOnly: true,
        sortField: 'startDate',
      });

      let lastError: any = null;
      for (const q of queries) {
        try {
          const res = await this.seriesRequest(q);
          if (!res.ok) {
            lastError = new Error(`HTTP ${res.status}`);
            continue;
          }
          const data = await res.json();
          const items = data.data || [];
          const mapped = items.map((it: any) => this.serialize(it));
          const own = mapped.filter((s: any) => {
            const uid = s?.user?.data?.id ?? s?.user?.id ?? s?.user;
            return uid === (currentUser as any)?.id;
          });
          return own;
        } catch (err) {
          lastError = err;
        }
      }
      throw lastError || new Error('Failed to fetch active series');
    } catch (error) {
      console.error('Get active series error:', error);
      throw error;
    }
  }
}

export default new SeriesService();
