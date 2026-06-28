/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StorageProvider, StorageFile } from './StorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';
import { GoogleDriveStorageProvider } from './GoogleDriveStorageProvider';
import { SupabaseStorageProvider } from './SupabaseStorageProvider';
import { logSystem } from '../db';

export class StorageService {
  private static instance: StorageService;
  private providers: Record<string, StorageProvider> = {};
  private activeProviderKey = 'local';

  private constructor() {
    this.providers['local'] = new LocalStorageProvider();
    this.providers['gdrive'] = new GoogleDriveStorageProvider();
    this.providers['supabase'] = new SupabaseStorageProvider();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  public getProvider(key: string = this.activeProviderKey): StorageProvider {
    const provider = this.providers[key];
    if (!provider) {
      throw new Error(`Storage provider with key [${key}] is not registered.`);
    }
    return provider;
  }

  public setActiveProvider(key: string): void {
    if (!this.providers[key]) {
      throw new Error(`Storage provider with key [${key}] is not registered.`);
    }
    this.activeProviderKey = key;
    logSystem('info', `Active Storage Provider updated to: [${this.providers[key].name}]`);
  }

  public getActiveProviderKey(): string {
    return this.activeProviderKey;
  }

  public async upload(filePath: string, fileBuffer: Buffer, mimeType: string, providerKey: string = this.activeProviderKey): Promise<string> {
    const provider = this.getProvider(providerKey);
    logSystem('info', `Executing file upload using: [${provider.name}]`);
    return provider.uploadFile('vault', filePath, fileBuffer, mimeType);
  }

  public async download(filePath: string, providerKey: string = this.activeProviderKey): Promise<Buffer> {
    const provider = this.getProvider(providerKey);
    return provider.downloadFile('vault', filePath);
  }

  public async delete(filePath: string, providerKey: string = this.activeProviderKey): Promise<boolean> {
    const provider = this.getProvider(providerKey);
    return provider.deleteFile('vault', filePath);
  }

  public async list(prefix?: string, providerKey: string = this.activeProviderKey): Promise<StorageFile[]> {
    const provider = this.getProvider(providerKey);
    return provider.listFiles('vault', prefix);
  }
}

export const storageService = StorageService.getInstance();
