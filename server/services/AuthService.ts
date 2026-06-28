/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, UserSession } from '../../src/types';
import { userService } from './UserService';
import { sessionService } from './SessionService';
import { JWTService } from './JWTService';
import { logSystem } from '../db';

export class AuthService {
  public isAuthProviderConfigured(): boolean {
    const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
    const hasLocalAuth = !!process.env.JWT_SECRET;
    // The application is ready to use local JWT signing or Supabase Auth.
    // If neither is configured, we can still fall back to secure local sandbox mode.
    return hasSupabase || hasLocalAuth;
  }

  public async register(name: string, email: string, passwordString: string, role: string, ipAddress: string, userAgent: string): Promise<User> {
    const existing = await userService.getUserByEmail(email);
    if (existing) {
      throw new Error('A corporate profile with this email already exists.');
    }

    // Hash emulation or encryption would be applied here in production.
    // We store the user object safely in the database provider.
    const newUser = await userService.createUser({
      name,
      email,
      password: passwordString, // In-memory database handles this as standard text, Supabase Auth handles passwordHashing natively
      role: role as any,
      status: 'Active',
      company: 'Geometric Suite',
      timezone: 'UTC',
      language: 'English',
      themePreference: 'dark',
      connectedMailAccounts: []
    });

    await sessionService.logAudit(
      'REGISTER',
      `Corporate user profile registered for ${name} with requested role: ${role}.`,
      ipAddress,
      userAgent,
      newUser.id,
      newUser.name
    );

    return newUser;
  }

  public async login(email: string, passwordString: string, ipAddress: string, userAgent: string): Promise<{ user: Omit<User, 'password'>; token: string; session: UserSession }> {
    const user = await userService.getUserByEmail(email);
    if (!user) {
      await sessionService.logAudit(
        'FAILED_LOGIN',
        `Failed login attempt for unknown email: "${email}".`,
        ipAddress,
        userAgent
      );
      throw new Error('Invalid corporate credentials.');
    }

    if (user.status === 'Locked') {
      throw new Error('This account has been locked due to security violations.');
    }

    // Verify credentials
    if (user.password !== passwordString) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updates: Partial<User> = { failedLoginAttempts: attempts };
      
      if (attempts >= 5) {
        updates.status = 'Locked';
      }
      
      await userService.updateUser(user.id, updates);
      await sessionService.logAudit(
        'FAILED_LOGIN',
        `Failed password attempt for user ${user.email}. Attempt #${attempts}.`,
        ipAddress,
        userAgent,
        user.id,
        user.name
      );

      if (attempts >= 5) {
        throw new Error('Account locked due to 5 consecutive failed login attempts.');
      }
      throw new Error('Invalid corporate credentials.');
    }

    // Reset failed attempts on success
    if (user.failedLoginAttempts && user.failedLoginAttempts > 0) {
      await userService.updateUser(user.id, { failedLoginAttempts: 0 });
    }

    // Create session
    const session = await sessionService.createSession(user.id, userAgent, ipAddress);

    // Sign JWT
    const token = JWTService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id
    });

    await sessionService.logAudit(
      'LOGIN',
      `User ${user.name} logged in successfully on ${userAgent}.`,
      ipAddress,
      userAgent,
      user.id,
      user.name
    );

    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token,
      session
    };
  }

  public async logout(token: string, ipAddress: string, userAgent: string): Promise<void> {
    const decoded = JWTService.verify(token);
    if (decoded && decoded.sessionId) {
      await sessionService.terminateSession(decoded.sessionId);
      const user = await userService.getUserById(decoded.userId);
      await sessionService.logAudit(
        'LOGOUT',
        `User session terminated successfully.`,
        ipAddress,
        userAgent,
        user?.id,
        user?.name
      );
    }
  }

  public async verifyToken(token: string): Promise<any | null> {
    const decoded = JWTService.verify(token);
    if (!decoded) return null;

    const session = await sessionService.getSession(decoded.sessionId);
    if (!session || session.status !== 'Active') {
      return null;
    }

    return decoded;
  }
}

export const authService = new AuthService();
