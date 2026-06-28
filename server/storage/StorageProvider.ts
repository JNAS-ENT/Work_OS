/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StorageFile {
  name: string;
  size: number;
  mimeType: string;
  path: string;
  updatedAt: string;
  downloadUrl?: string;
}

export interface StorageProvider {
  name: string;
  uploadFile(bucketName: string, filePath: string, fileBuffer: Buffer, mimeType: string): Promise<string>;
  downloadFile(bucketName: string, filePath: string): Promise<Buffer>;
  deleteFile(bucketName: string, filePath: string): Promise<boolean>;
  listFiles(bucketName: string, prefix?: string): Promise<StorageFile[]>;
}
