/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { userRepository } from '../repositories/Repositories';
import { User } from '../../src/types';

export class UserService {
  public async getUserById(id: string): Promise<User | null> {
    return userRepository.findById(id);
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    return userRepository.findOne({ email });
  }

  public async createUser(data: Partial<User>): Promise<User> {
    return userRepository.create(data);
  }

  public async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    return userRepository.update(id, data);
  }

  public async deleteUser(id: string): Promise<boolean> {
    return userRepository.delete(id);
  }

  public async listUsers(): Promise<User[]> {
    return userRepository.find();
  }
}

export const userService = new UserService();
