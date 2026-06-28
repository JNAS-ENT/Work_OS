/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';

export class EncryptionService {
  private static getSecretKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY || 'work_os_v2_default_fallback_encryption_key_32_chars_long!';
    // Standardize key to exactly 32 bytes via SHA-256 hash for AES-256 compatibility
    return crypto.createHash('sha256').update(key).digest();
  }

  public static encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', this.getSecretKey(), iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (err) {
      console.error('Encryption failed:', err);
      return text;
    }
  }

  public static decrypt(encryptedText: string): string {
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 2) {
        return encryptedText; // Fallback if raw
      }

      const [ivHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.getSecretKey(), iv);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      return encryptedText;
    }
  }
}
