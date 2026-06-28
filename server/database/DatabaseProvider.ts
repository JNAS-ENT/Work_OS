/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface QueryOptions {
  limit?: number;
  offset?: number;
  filter?: any;
  sort?: { field: string; order: 'asc' | 'desc' };
  search?: string;
  searchFields?: string[];
}

export interface DatabaseProvider {
  name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  find<T>(collection: string, query?: any, options?: QueryOptions): Promise<T[]>;
  findOne<T>(collection: string, query: any): Promise<T | null>;
  insert<T>(collection: string, data: any): Promise<T>;
  update<T>(collection: string, query: any, data: any): Promise<T[]>;
  delete(collection: string, query: any): Promise<boolean>;
  count(collection: string, query?: any): Promise<number>;
  transaction<T>(callback: (provider: DatabaseProvider) => Promise<T>): Promise<T>;
}
