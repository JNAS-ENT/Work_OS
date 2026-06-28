/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserSession, AuditLog } from '../../src/types';
import { databaseService } from '../database/DatabaseService';

export class SessionService {
  private getProvider() {
    return databaseService.getProvider();
  }

  public async createSession(userId: string, device: string, ipAddress: string): Promise<UserSession> {
    const session: UserSession = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId,
      device,
      browser: device.includes('Chrome') ? 'Google Chrome' : 'Web Browser',
      ipAddress,
      loginTime: new Date().toISOString(),
      lastActiveTime: new Date().toISOString(),
      status: 'Active'
    };

    await this.getProvider().insert('userSessions', session);
    return session;
  }

  public async getSession(id: string): Promise<UserSession | null> {
    return this.getProvider().findOne('userSessions', { id });
  }

  public async terminateSession(id: string): Promise<void> {
    await this.getProvider().update('userSessions', { id }, { status: 'Terminated' });
  }

  public async getActiveSessions(userId: string): Promise<UserSession[]> {
    return this.getProvider().find('userSessions', { userId, status: 'Active' });
  }

  public async logAudit(action: string, details: string, ipAddress: string, device: string, userId?: string, userName?: string): Promise<AuditLog> {
    const log: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId,
      userName,
      action,
      details,
      ipAddress,
      device,
      timestamp: new Date().toISOString()
    };

    await this.getProvider().insert('auditLogs', log);
    return log;
  }

  public async getAuditLogs(): Promise<AuditLog[]> {
    return this.getProvider().find('auditLogs', {}, { sort: { field: 'timestamp', order: 'desc' } });
  }
}

export const sessionService = new SessionService();
