/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, UserSession } from '../../src/types';
import { userService } from './UserService';
import { sessionService } from './SessionService';
import { JWTService } from './JWTService';
import { logSystem } from '../db';
import { getSupabaseClient } from '../supabaseClient';

export class AuthService {
  public isAuthProviderConfigured(): boolean {
    const hasSupabase = !!(process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE));
    return hasSupabase;
  }

  public async register(name: string, email: string, passwordString: string, role: string, ipAddress: string, userAgent: string): Promise<any> {
    const supabase = getSupabaseClient();

    // 1. Sign up the user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password: passwordString,
      options: {
        data: {
          name,
        }
      }
    });

    if (error) {
      throw new Error(`Supabase Auth Registration Failed: ${error.message}`);
    }

    const authUser = data.user;
    if (!authUser) {
      throw new Error('Supabase Auth returned empty user profile after registration.');
    }

    // 2. Insert user profile into the profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        email: email,
        name: name,
        role: role || 'viewer',
        status: 'Active',
        created_at: new Date().toISOString()
      });

    if (profileError) {
      console.error(`Failed to register profile record in Supabase: ${profileError.message}`);
      // Fallback: log warning, do not crash if insert fails (e.g. if table does not exist yet)
    }

    await sessionService.logAudit(
      'REGISTER',
      `Corporate user profile registered for ${name} using Supabase Auth.`,
      ipAddress,
      userAgent,
      authUser.id,
      name
    );

    return {
      id: authUser.id,
      name,
      email,
      role: role || 'viewer',
      status: 'Active'
    };
  }

  public async login(email: string, passwordString: string, ipAddress: string, userAgent: string): Promise<{ user: any; token: string; session: UserSession }> {
    const supabase = getSupabaseClient();

    // 1. Authenticate credentials via Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: passwordString
    });

    if (error) {
      await sessionService.logAudit(
        'FAILED_LOGIN',
        `Failed Supabase login attempt for email: "${email}". Reason: ${error.message}`,
        ipAddress,
        userAgent
      );
      throw new Error(`Invalid credentials: ${error.message}`);
    }

    const authUser = data.user;
    if (!authUser) {
      throw new Error('Supabase authentication succeeded but returned no user.');
    }

    // 2. Fetch profile from the "profiles" table in Supabase
    let userRole = 'viewer';
    let userName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User';
    let userStatus = 'Active';

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      console.warn(`Could not load profiles table for user ${authUser.id}: ${profileError.message}. Defaulting to Viewer role.`);
    } else if (profile) {
      userRole = profile.role || 'viewer';
      userName = profile.name || userName;
      userStatus = profile.status || 'Active';
    }

    if (userStatus === 'Locked') {
      throw new Error('This account has been locked due to security violations.');
    }

    // 3. Create session locally or via token manager
    const session = await sessionService.createSession(authUser.id, userAgent, ipAddress);

    await sessionService.logAudit(
      'LOGIN',
      `User ${userName} logged in successfully via Supabase.`,
      ipAddress,
      userAgent,
      authUser.id,
      userName
    );

    return {
      user: {
        id: authUser.id,
        email: authUser.email || email,
        name: userName,
        role: userRole,
        status: userStatus
      },
      token: data.session?.access_token || '',
      session
    };
  }

  public async logout(token: string, ipAddress: string, userAgent: string): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch (err: any) {
      console.warn('Supabase Auth signOut issue:', err.message);
    }

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
    try {
      const supabase = getSupabaseClient();
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return null;
      }

      // Load profile role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('id', user.id)
        .single();

      return {
        userId: user.id,
        email: user.email,
        name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0],
        role: profile?.role || 'viewer'
      };
    } catch {
      // Fallback locally just in case
      const decoded = JWTService.verify(token);
      return decoded;
    }
  }
}

export const authService = new AuthService();
