/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseProvider, QueryOptions } from './DatabaseProvider';
import { readDb, writeDb, DatabaseSchema } from '../db';

export class JsonDatabaseProvider implements DatabaseProvider {
  public name = 'JSON File Database';

  async connect(): Promise<void> {
    // Already loaded via readDb
  }

  async disconnect(): Promise<void> {
    // No-op for JSON
  }

  private filterItems<T>(items: T[], query: any, options?: QueryOptions): T[] {
    let result = [...items];

    // Simple Filter Matching
    if (query && Object.keys(query).length > 0) {
      result = result.filter(item => {
        for (const key of Object.keys(query)) {
          const val = query[key];
          if (val && typeof val === 'object' && ('$eq' in val || '$ne' in val || '$in' in val)) {
            // Extended operators
            if ('$eq' in val && (item as any)[key] !== val.$eq) return false;
            if ('$ne' in val && (item as any)[key] === val.$ne) return false;
            if ('$in' in val && Array.isArray(val.$in) && !val.$in.includes((item as any)[key])) return false;
          } else {
            // Direct equality
            if ((item as any)[key] !== val) return false;
          }
        }
        return true;
      });
    }

    // Search query matching
    if (options?.search && options.searchFields && options.searchFields.length > 0) {
      const searchLower = options.search.toLowerCase();
      result = result.filter(item => {
        return options.searchFields!.some(field => {
          const val = (item as any)[field];
          if (val && typeof val === 'string') {
            return val.toLowerCase().includes(searchLower);
          }
          return false;
        });
      });
    }

    // Sorting
    if (options?.sort) {
      const { field, order } = options.sort;
      result.sort((a, b) => {
        const valA = (a as any)[field];
        const valB = (b as any)[field];

        if (valA === undefined || valA === null) return order === 'asc' ? 1 : -1;
        if (valB === undefined || valB === null) return order === 'asc' ? -1 : 1;

        if (typeof valA === 'string' && typeof valB === 'string') {
          return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        return order === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
    }

    // Pagination
    if (options?.offset !== undefined || options?.limit !== undefined) {
      const offset = options.offset || 0;
      const limit = options.limit || result.length;
      result = result.slice(offset, offset + limit);
    }

    return result;
  }

  async find<T>(collection: string, query?: any, options?: QueryOptions): Promise<T[]> {
    const db = readDb();
    const items = (db as any)[collection] || [];
    return this.filterItems<T>(items, query, options);
  }

  async findOne<T>(collection: string, query: any): Promise<T | null> {
    const db = readDb();
    const items = (db as any)[collection] || [];
    const results = this.filterItems<T>(items, query, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  async insert<T>(collection: string, data: any): Promise<T> {
    const db = readDb();
    if (!(db as any)[collection]) {
      (db as any)[collection] = [];
    }

    const newItem = { ...data };
    if (!newItem.id) {
      newItem.id = `${collection.substring(0, 3)}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    }
    if (!newItem.createdAt) {
      newItem.createdAt = new Date().toISOString();
    }

    (db as any)[collection].unshift(newItem);
    writeDb(db);
    return newItem as T;
  }

  async update<T>(collection: string, query: any, data: any): Promise<T[]> {
    const db = readDb();
    const items = (db as any)[collection] || [];
    const matchedIndices: number[] = [];

    items.forEach((item: any, index: number) => {
      let matches = true;
      for (const key of Object.keys(query)) {
        if (item[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        matchedIndices.push(index);
      }
    });

    const updatedItems: T[] = [];
    for (const index of matchedIndices) {
      const updated = { ...items[index], ...data, updatedAt: new Date().toISOString() };
      items[index] = updated;
      updatedItems.push(updated);
    }

    if (matchedIndices.length > 0) {
      writeDb(db);
    }

    return updatedItems;
  }

  async delete(collection: string, query: any): Promise<boolean> {
    const db = readDb();
    const items = (db as any)[collection] || [];
    const initialLength = items.length;

    const filteredItems = items.filter((item: any) => {
      let matches = true;
      for (const key of Object.keys(query)) {
        if (item[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      return !matches; // Keep items that don't match query
    });

    if (filteredItems.length !== initialLength) {
      (db as any)[collection] = filteredItems;
      writeDb(db);
      return true;
    }

    return false;
  }

  async count(collection: string, query?: any): Promise<number> {
    const db = readDb();
    const items = (db as any)[collection] || [];
    if (!query || Object.keys(query).length === 0) {
      return items.length;
    }
    return this.filterItems(items, query).length;
  }

  async transaction<T>(callback: (provider: DatabaseProvider) => Promise<T>): Promise<T> {
    // For local JSON, transactions run sequentially on the provider instance
    return callback(this);
  }
}
