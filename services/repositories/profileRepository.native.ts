// Native (iOS/Android) repository for User Profiles using SQLite.
import { getCurrentUserId, getEffectiveUserId } from '@/services/authSession';
import { exec, initDb, queryFirst } from '@/services/db/index.native';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import UUID from 'react-native-uuid';

const TAG = '[ProfileRepo]';

// Helper function to get the effective user ID
async function getRepositoryUserId(): Promise<string> {
  return await getEffectiveUserId();
}

export interface ProfileDTO {
  id: string;
  userId: string;
  fullName?: string | null;
  title?: string | null;
  church?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  title?: string;
  church?: string;
  avatarUrl?: string;
  bio?: string;
}

function rowToDTO(row: any): ProfileDTO {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name ?? null,
    title: row.title ?? null,
    church: row.church ?? null,
    avatarUrl: row.avatar_url ?? null,
    bio: row.bio ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const profileRepository = {
  async getCurrent(): Promise<ProfileDTO | null> {
    await initDb();
    const userId = await getRepositoryUserId();

    const row = await queryFirst<any>(
      `SELECT * FROM profiles WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    if (!row) return null;
    return rowToDTO(row);
  },

  async update(input: UpdateProfileInput): Promise<ProfileDTO> {
    await initDb();
    const userId = await getRepositoryUserId();
    const now = new Date().toISOString();

    // Check if profile exists
    const existing = await queryFirst<any>(
      `SELECT id FROM profiles WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    if (existing) {
      // Update existing profile
      await exec(
        `UPDATE profiles
         SET full_name = ?, title = ?, church = ?, avatar_url = ?, bio = ?, updated_at = ?
         WHERE user_id = ?`,
        [
          input.fullName ?? null,
          input.title ?? null,
          input.church ?? null,
          input.avatarUrl ?? null,
          input.bio ?? null,
          now,
          userId,
        ]
      );

      // Get updated profile
      const row = await queryFirst<any>(
        `SELECT * FROM profiles WHERE user_id = ? LIMIT 1`,
        [userId]
      );

      if (!row) throw new Error('Profile not found after update');
      return rowToDTO(row);
    } else {
      // Create new profile
      const id = UUID.v4() as string;

      await exec(
        `INSERT INTO profiles (id, user_id, full_name, title, church, avatar_url, bio, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          input.fullName ?? null,
          input.title ?? null,
          input.church ?? null,
          input.avatarUrl ?? null,
          input.bio ?? null,
          now,
          now,
        ]
      );

      // Get created profile
      const row = await queryFirst<any>(
        `SELECT * FROM profiles WHERE user_id = ? LIMIT 1`,
        [userId]
      );

      if (!row) throw new Error('Profile not found after creation');
      return rowToDTO(row);
    }
  },

  // Helper to sync to Convex when user is authenticated
  async syncToConvex(): Promise<void> {
    // This is a placeholder - actual sync should be triggered from the component
    // when the user is authenticated and has made changes
    console.log(TAG, 'Sync to Convex requested');
  },
};
