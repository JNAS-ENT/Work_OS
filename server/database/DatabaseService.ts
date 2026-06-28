/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseProvider } from './DatabaseProvider';
import { JsonDatabaseProvider } from './JsonDatabaseProvider';
import { SupabaseDatabaseProvider } from './SupabaseDatabaseProvider';
import { logSystem } from '../db';

export class DatabaseService {
  private static instance: DatabaseService;
  private provider: DatabaseProvider;
  private isSupabaseEnabled = false;

  private constructor() {
    const hasSupabase = !!(process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE));
    
    if (hasSupabase) {
      this.provider = new SupabaseDatabaseProvider();
      this.isSupabaseEnabled = true;
    } else {
      this.provider = new JsonDatabaseProvider();
      this.isSupabaseEnabled = false;
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getProvider(): DatabaseProvider {
    return this.provider;
  }

  public isUsingSupabase(): boolean {
    return this.isSupabaseEnabled;
  }

  public async initialize(): Promise<void> {
    try {
      logSystem('info', `Initializing Work OS Database Adapter: [${this.provider.name}]`);
      await this.provider.connect();
      logSystem('info', `Database Service connected successfully via: [${this.provider.name}]`);
    } catch (err: any) {
      logSystem('error', `Primary Database connection failed for [${this.provider.name}]: ${err.message}. Falling back to JSON database.`);
      this.provider = new JsonDatabaseProvider();
      await this.provider.connect();
    }
  }

  public async switchProvider(useSupabase: boolean): Promise<void> {
    try {
      await this.provider.disconnect();
      if (useSupabase) {
        this.provider = new SupabaseDatabaseProvider();
        this.isSupabaseEnabled = true;
      } else {
        this.provider = new JsonDatabaseProvider();
        this.isSupabaseEnabled = false;
      }
      await this.provider.connect();
      logSystem('info', `Switched Database Provider to [${this.provider.name}] successfully.`);
    } catch (err: any) {
      logSystem('error', `Failed to switch database provider: ${err.message}`);
      throw err;
    }
  }
}

export const databaseService = DatabaseService.getInstance();
