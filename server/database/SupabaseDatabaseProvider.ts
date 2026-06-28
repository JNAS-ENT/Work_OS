/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseProvider, QueryOptions } from './DatabaseProvider';

export class SupabaseDatabaseProvider implements DatabaseProvider {
  public name = 'Supabase Cloud Database';
  private client: SupabaseClient | null = null;

  async connect(): Promise<void> {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Supabase URL or Key environment variables are missing. Provider cannot connect.');
    }

    try {
      this.client = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      });
      console.log('Successfully initialized Supabase Database Client connection.');
    } catch (err: any) {
      console.error('Supabase client connection failed:', err.message);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    this.client = null;
  }

  private getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Database not connected. Please call connect() first.');
    }
    return this.client;
  }

  async find<T>(collection: string, query?: any, options?: QueryOptions): Promise<T[]> {
    const supabase = this.getClient();
    let q = supabase.from(collection).select('*');

    // Filter mapping
    if (query && Object.keys(query).length > 0) {
      for (const key of Object.keys(query)) {
        const val = query[key];
        if (val && typeof val === 'object') {
          if ('$eq' in val) q = q.eq(key, val.$eq);
          if ('$ne' in val) q = q.neq(key, val.$ne);
          if ('$in' in val) q = q.in(key, val.$in);
        } else {
          q = q.eq(key, val);
        }
      }
    }

    // Full-text search emulation via ilike on specified fields
    if (options?.search && options.searchFields && options.searchFields.length > 0) {
      const searchVal = `%${options.search}%`;
      const searchFilters = options.searchFields.map(field => `${field}.ilike.${searchVal}`).join(',');
      q = q.or(searchFilters);
    }

    // Sorting
    if (options?.sort) {
      const { field, order } = options.sort;
      q = q.order(field, { ascending: order === 'asc' });
    }

    // Pagination
    if (options?.offset !== undefined || options?.limit !== undefined) {
      const from = options.offset || 0;
      const to = from + (options.limit || 100) - 1;
      q = q.range(from, to);
    }

    const { data, error } = await q;
    if (error) {
      throw new Error(`Supabase find error on table [${collection}]: ${error.message}`);
    }

    return (data || []) as T[];
  }

  async findOne<T>(collection: string, query: any): Promise<T | null> {
    const results = await this.find<T>(collection, query, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  async insert<T>(collection: string, data: any): Promise<T> {
    const supabase = this.getClient();
    const { data: inserted, error } = await supabase
      .from(collection)
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase insert error on table [${collection}]: ${error.message}`);
    }

    return inserted as T;
  }

  async update<T>(collection: string, query: any, data: any): Promise<T[]> {
    const supabase = this.getClient();
    let q = supabase.from(collection).update(data);

    if (query && Object.keys(query).length > 0) {
      for (const key of Object.keys(query)) {
        q = q.eq(key, query[key]);
      }
    }

    const { data: updated, error } = await q.select();
    if (error) {
      throw new Error(`Supabase update error on table [${collection}]: ${error.message}`);
    }

    return (updated || []) as T[];
  }

  async delete(collection: string, query: any): Promise<boolean> {
    const supabase = this.getClient();
    let q = supabase.from(collection).delete();

    if (query && Object.keys(query).length > 0) {
      for (const key of Object.keys(query)) {
        q = q.eq(key, query[key]);
      }
    }

    const { error } = await q;
    if (error) {
      throw new Error(`Supabase delete error on table [${collection}]: ${error.message}`);
    }

    return true;
  }

  async count(collection: string, query?: any): Promise<number> {
    const supabase = this.getClient();
    let q = supabase.from(collection).select('*', { count: 'exact', head: true });

    if (query && Object.keys(query).length > 0) {
      for (const key of Object.keys(query)) {
        q = q.eq(key, query[key]);
      }
    }

    const { count, error } = await q;
    if (error) {
      throw new Error(`Supabase count error on table [${collection}]: ${error.message}`);
    }

    return count || 0;
  }

  async transaction<T>(callback: (provider: DatabaseProvider) => Promise<T>): Promise<T> {
    // Note: Supabase supports database-level transactions natively through PL/pgSQL functions.
    // For general client operations, we execute operations on the same client.
    return callback(this);
  }
}
