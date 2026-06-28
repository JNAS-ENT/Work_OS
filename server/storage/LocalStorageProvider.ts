/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { StorageProvider, StorageFile } from './StorageProvider';

export class LocalStorageProvider implements StorageProvider {
  public name = 'Local File System Storage';
  private storageDir = path.join(process.cwd(), 'data', 'storage');

  constructor() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  private getFullPath(bucketName: string, filePath: string): string {
    const bucketDir = path.join(this.storageDir, bucketName);
    if (!fs.existsSync(bucketDir)) {
      fs.mkdirSync(bucketDir, { recursive: true });
    }
    return path.join(bucketDir, filePath);
  }

  async uploadFile(bucketName: string, filePath: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
    const fullPath = this.getFullPath(bucketName, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, fileBuffer);
    return `/api/storage/local/download?bucket=${bucketName}&path=${encodeURIComponent(filePath)}`;
  }

  async downloadFile(bucketName: string, filePath: string): Promise<Buffer> {
    const fullPath = this.getFullPath(bucketName, filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found at: ${filePath}`);
    }
    return fs.readFileSync(fullPath);
  }

  async deleteFile(bucketName: string, filePath: string): Promise<boolean> {
    const fullPath = this.getFullPath(bucketName, filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  }

  async listFiles(bucketName: string, prefix?: string): Promise<StorageFile[]> {
    const bucketDir = path.join(this.storageDir, bucketName);
    if (!fs.existsSync(bucketDir)) {
      return [];
    }

    const getAllFiles = (dirPath: string, fileList: string[] = []): string[] => {
      const files = fs.readdirSync(dirPath);
      files.forEach(file => {
        const fullFilePath = path.join(dirPath, file);
        if (fs.statSync(fullFilePath).isDirectory()) {
          fileList = getAllFiles(fullFilePath, fileList);
        } else {
          fileList.push(fullFilePath);
        }
      });
      return fileList;
    };

    const allPaths = getAllFiles(bucketDir);
    const files: StorageFile[] = allPaths.map(fp => {
      const stat = fs.statSync(fp);
      const relativePath = path.relative(bucketDir, fp).replace(/\\/g, '/');
      return {
        name: path.basename(fp),
        size: stat.size,
        mimeType: 'application/octet-stream', // Emulated
        path: relativePath,
        updatedAt: stat.mtime.toISOString(),
        downloadUrl: `/api/storage/local/download?bucket=${bucketName}&path=${encodeURIComponent(relativePath)}`
      };
    });

    if (prefix) {
      return files.filter(f => f.path.startsWith(prefix));
    }
    return files;
  }
}
