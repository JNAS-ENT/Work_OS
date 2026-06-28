/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OAuthToken } from '../../src/types';
import { databaseService } from '../database/DatabaseService';
import { EncryptionService } from './EncryptionService';
import { logSystem } from '../db';

export class TokenManager {
  private getProvider() {
    return databaseService.getProvider();
  }

  public async saveToken(connectionId: string, accessToken: string, refreshToken?: string, expiresInSeconds?: number): Promise<OAuthToken> {
    const encryptedAccessToken = EncryptionService.encrypt(accessToken);
    const encryptedRefreshToken = refreshToken ? EncryptionService.encrypt(refreshToken) : undefined;
    const expiresAt = expiresInSeconds ? new Date(Date.now() + expiresInSeconds * 1000).toISOString() : undefined;

    const existing = await this.getProvider().findOne<any>('oauthTokens', { connectionId });

    if (existing) {
      const updated = await this.getProvider().update<OAuthToken>('oauthTokens', { connectionId }, {
        encryptedAccessToken,
        encryptedRefreshToken: encryptedRefreshToken || existing.encryptedRefreshToken,
        expiresAt: expiresAt || existing.expiresAt
      });
      logSystem('info', `OAuth access tokens updated and encrypted for connection: "${connectionId}"`);
      return updated[0];
    } else {
      const inserted = await this.getProvider().insert<OAuthToken>('oauthTokens', {
        id: `tok_${Date.now()}`,
        connectionId,
        encryptedAccessToken,
        encryptedRefreshToken,
        expiresAt
      });
      logSystem('info', `New OAuth credential registered and encrypted for connection: "${connectionId}"`);
      return inserted;
    }
  }

  public async getAccessToken(connectionId: string): Promise<string | null> {
    const record = await this.getProvider().findOne<OAuthToken>('oauthTokens', { connectionId });
    if (!record) return null;

    // Check expiry
    if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) {
      logSystem('info', `OAuth token for connection "${connectionId}" has expired. Auto-refresh required.`);
      return null;
    }

    return EncryptionService.decrypt(record.encryptedAccessToken);
  }

  public async removeToken(connectionId: string): Promise<boolean> {
    return this.getProvider().delete('oauthTokens', { connectionId });
  }
}

export const tokenManager = new TokenManager();
