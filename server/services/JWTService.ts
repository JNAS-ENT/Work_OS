/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';

export class JWTService {
  private static getSecret(): string {
    return process.env.JWT_SECRET || 'work_os_v2_default_fallback_jwt_secret_key_123';
  }

  public static sign(payload: any, expiresInSeconds: number = 86400): string {
    const secret = this.getSecret();
    const header = { alg: 'HS256', typ: 'JWT' };
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const fullPayload = { ...payload, exp };

    const base64UrlHeader = this.base64UrlEncode(JSON.stringify(header));
    const base64UrlPayload = this.base64UrlEncode(JSON.stringify(fullPayload));

    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${base64UrlHeader}.${base64UrlPayload}`)
      .digest('base64url');

    return `${base64UrlHeader}.${base64UrlPayload}.${signature}`;
  }

  public static verify(token: string): any | null {
    try {
      const secret = this.getSecret();
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [header, payload, signature] = parts;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${header}.${payload}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        return null;
      }

      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
      if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
        return null; // Expired
      }

      return decodedPayload;
    } catch (err) {
      return null;
    }
  }

  private static base64UrlEncode(str: string): string {
    return Buffer.from(str).toString('base64url');
  }
}
