/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EncryptionService } from './EncryptionService';
import { databaseService } from '../database/DatabaseService';
import { logSystem } from '../db';

export class SecretManager {
  private getProvider() {
    return databaseService.getProvider();
  }

  public async storeSecret(key: string, secretValue: string): Promise<void> {
    const encrypted = EncryptionService.encrypt(secretValue);
    
    // Check if key already exists
    const existing = await this.getProvider().findOne('providerSettings', { key });
    if (existing) {
      await this.getProvider().update('providerSettings', { key }, { value: encrypted, updatedAt: new Date().toISOString() });
    } else {
      await this.getProvider().insert('providerSettings', {
        id: `sec_${Date.now()}`,
        key,
        value: encrypted,
        updatedAt: new Date().toISOString()
      });
    }
    
    logSystem('info', `Secured credential registered under alias key: "${key}"`);
  }

  public async retrieveSecret(key: string): Promise<string | null> {
    const record = await this.getProvider().findOne<any>('providerSettings', { key });
    if (!record || !record.value) {
      return null;
    }
    return EncryptionService.decrypt(record.value);
  }

  public async deleteSecret(key: string): Promise<boolean> {
    return this.getProvider().delete('providerSettings', { key });
  }
}

export const secretManager = new SecretManager();
