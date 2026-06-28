/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageProvider, StorageFile } from './StorageProvider';
import { logSystem } from '../db';

export class SupabaseStorageProvider implements StorageProvider {
  public name = 'Supabase Cloud Bucket Storage';
  private client: SupabaseClient | null = null;

  private connect() {
    if (this.client) return;
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;

    if (url && key) {
      this.client = createClient(url, key);
    }
  }

  private getClient(): SupabaseClient {
    this.connect();
    if (!this.client) {
      throw new Error('Supabase Storage Provider is not configured (SUPABASE_URL or Keys are missing).');
    }
    return this.client;
  }

  async uploadFile(bucketName: string, filePath: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
    const supabase = this.getClient();
    
    // Ensure bucket exists or create it
    const { error: uploadError, data } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Supabase storage upload error: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  async downloadFile(bucketName: string, filePath: string): Promise<Buffer> {
    const supabase = this.getClient();
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      throw new Error(`Supabase storage download error: ${error.message}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async deleteFile(bucketName: string, filePath: string): Promise<boolean> {
    const supabase = this.getClient();
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      throw new Error(`Supabase storage deletion error: ${error.message}`);
    }
    return true;
  }

  async listFiles(bucketName: string, prefix?: string): Promise<StorageFile[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(prefix || '');

    if (error) {
      logSystem('error', `Supabase listFiles error: ${error.message}`);
      return [];
    }

    return (data || []).map(item => {
      const pathWithPrefix = prefix ? `${prefix}/${item.name}` : item.name;
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(pathWithPrefix);

      return {
        name: item.name,
        size: item.metadata?.size || 0,
        mimeType: item.metadata?.mimetype || 'application/octet-stream',
        path: pathWithPrefix,
        updatedAt: item.updated_at || new Date().toISOString(),
        downloadUrl: publicUrlData?.publicUrl
      };
    });
  }
}
