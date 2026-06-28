/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseProvider, QueryOptions } from '../database/DatabaseProvider';
import { databaseService } from '../database/DatabaseService';

export class BaseRepository<T> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected getProvider(): DatabaseProvider {
    return databaseService.getProvider();
  }

  async create(data: Partial<T> & { id?: string }): Promise<T> {
    return this.getProvider().insert<T>(this.collectionName, data);
  }

  async findById(id: string): Promise<T | null> {
    return this.getProvider().findOne<T>(this.collectionName, { id });
  }

  async findOne(query: any): Promise<T | null> {
    return this.getProvider().findOne<T>(this.collectionName, query);
  }

  async find(query?: any, options?: QueryOptions): Promise<T[]> {
    return this.getProvider().find<T>(this.collectionName, query, options);
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const updated = await this.getProvider().update<T>(this.collectionName, { id }, data);
    return updated.length > 0 ? updated[0] : null;
  }

  async delete(id: string): Promise<boolean> {
    return this.getProvider().delete(this.collectionName, { id });
  }

  async count(query?: any): Promise<number> {
    return this.getProvider().count(this.collectionName, query);
  }
}
