import { AgentSearch } from '@/types';
import { exec, queryAll, queryFirst } from '../db';

export class AgentSearchRepository {
  async create(search: Omit<AgentSearch, 'id' | 'createdAt' | 'updatedAt' | 'dirty' | 'op' | 'version'>): Promise<AgentSearch> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const agentSearch: AgentSearch = {
      id,
      userId: search.userId,
      agentType: search.agentType,
      searchType: search.searchType,
      query: search.query,
      response: search.response,
      metadata: search.metadata,
      success: search.success,
      errorMessage: search.errorMessage,
      responseTimeMs: search.responseTimeMs,
      tokensUsed: search.tokensUsed,
      costUsd: search.costUsd,
      createdAt: new Date(now),
      updatedAt: new Date(now),
      deletedAt: search.deletedAt,
      syncedAt: search.syncedAt,
      dirty: true,
      op: 'upsert',
      version: 0,
    };

    await exec(
      `INSERT INTO agent_searches (
        id, user_id, agent_type, search_type, query, response, metadata,
        success, error_message, response_time_ms, tokens_used, cost_usd,
        created_at, updated_at, deleted_at, synced_at, dirty, op, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        agentSearch.id,
        agentSearch.userId,
        agentSearch.agentType,
        agentSearch.searchType,
        agentSearch.query,
        agentSearch.response || null,
        agentSearch.metadata ? JSON.stringify(agentSearch.metadata) : null,
        agentSearch.success ? 1 : 0,
        agentSearch.errorMessage || null,
        agentSearch.responseTimeMs || null,
        agentSearch.tokensUsed || null,
        agentSearch.costUsd || null,
        now,
        now,
        agentSearch.deletedAt?.toISOString() || null,
        agentSearch.syncedAt?.toISOString() || null,
        agentSearch.dirty ? 1 : 0,
        agentSearch.op,
        agentSearch.version,
      ]
    );

    return agentSearch;
  }

  async getById(id: string): Promise<AgentSearch | null> {
    const row = await queryFirst<{
      id: string;
      user_id: string;
      agent_type: string;
      search_type: string;
      query: string;
      response: string | null;
      metadata: string | null;
      success: number;
      error_message: string | null;
      response_time_ms: number | null;
      tokens_used: number | null;
      cost_usd: number | null;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
      synced_at: string | null;
      dirty: number;
      op: string;
      version: number;
    }>('SELECT * FROM agent_searches WHERE id = ? AND deleted_at IS NULL', [id]);

    if (!row) return null;

    return this.mapRowToAgentSearch(row);
  }

  async getByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<AgentSearch[]> {
    const rows = await queryAll<{
      id: string;
      user_id: string;
      agent_type: string;
      search_type: string;
      query: string;
      response: string | null;
      metadata: string | null;
      success: number;
      error_message: string | null;
      response_time_ms: number | null;
      tokens_used: number | null;
      cost_usd: number | null;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
      synced_at: string | null;
      dirty: number;
      op: string;
      version: number;
    }>(
      'SELECT * FROM agent_searches WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );

    return rows.map(row => this.mapRowToAgentSearch(row));
  }

  async getBySearchType(userId: string, searchType: string, limit: number = 50): Promise<AgentSearch[]> {
    const rows = await queryAll<{
      id: string;
      user_id: string;
      agent_type: string;
      search_type: string;
      query: string;
      response: string | null;
      metadata: string | null;
      success: number;
      error_message: string | null;
      response_time_ms: number | null;
      tokens_used: number | null;
      cost_usd: number | null;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
      synced_at: string | null;
      dirty: number;
      op: string;
      version: number;
    }>(
      'SELECT * FROM agent_searches WHERE user_id = ? AND search_type = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT ?',
      [userId, searchType, limit]
    );

    return rows.map(row => this.mapRowToAgentSearch(row));
  }

  async update(id: string, updates: Partial<Pick<AgentSearch, 'response' | 'success' | 'errorMessage' | 'responseTimeMs' | 'tokensUsed' | 'costUsd'>>): Promise<void> {
    const now = new Date().toISOString();
    
    await exec(
      `UPDATE agent_searches SET 
        response = COALESCE(?, response),
        success = COALESCE(?, success),
        error_message = COALESCE(?, error_message),
        response_time_ms = COALESCE(?, response_time_ms),
        tokens_used = COALESCE(?, tokens_used),
        cost_usd = COALESCE(?, cost_usd),
        updated_at = ?,
        dirty = 1,
        version = version + 1
      WHERE id = ?`,
      [
        updates.response || null,
        updates.success !== undefined ? (updates.success ? 1 : 0) : null,
        updates.errorMessage || null,
        updates.responseTimeMs || null,
        updates.tokensUsed || null,
        updates.costUsd || null,
        now,
        id,
      ]
    );
  }

  async delete(id: string): Promise<void> {
    const now = new Date().toISOString();
    
    await exec(
      'UPDATE agent_searches SET deleted_at = ?, updated_at = ?, dirty = 1, op = ? WHERE id = ?',
      [now, now, 'delete', id]
    );
  }

  private mapRowToAgentSearch(row: any): AgentSearch {
    return {
      id: row.id,
      userId: row.user_id,
      agentType: row.agent_type as AgentSearch['agentType'],
      searchType: row.search_type as AgentSearch['searchType'],
      query: row.query,
      response: row.response || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      success: row.success === 1,
      errorMessage: row.error_message || undefined,
      responseTimeMs: row.response_time_ms || undefined,
      tokensUsed: row.tokens_used || undefined,
      costUsd: row.cost_usd || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
      syncedAt: row.synced_at ? new Date(row.synced_at) : undefined,
      dirty: row.dirty === 1,
      op: row.op as AgentSearch['op'],
      version: row.version,
    };
  }
}

export const agentSearchRepository = new AgentSearchRepository();