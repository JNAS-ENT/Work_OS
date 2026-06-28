/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseRepository } from './BaseRepository';
import { 
  User, Email, MailAccount, Task, Project, Customer, 
  Meeting, FileItem, Notification, AutomationWorkflow, ProviderSetting, AiAnalysis
} from '../../src/types';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }
}

export class EmailRepository extends BaseRepository<Email> {
  constructor() {
    super('emails');
  }
}

export class MailAccountRepository extends BaseRepository<MailAccount> {
  constructor() {
    super('mailAccounts');
  }
}

export class TaskRepository extends BaseRepository<Task> {
  constructor() {
    super('tasks');
  }
}

export class ProjectRepository extends BaseRepository<Project> {
  constructor() {
    super('projects');
  }
}

export class CustomerRepository extends BaseRepository<Customer> {
  constructor() {
    super('customers');
  }
}

export class ContactRepository extends BaseRepository<Customer> {
  constructor() {
    super('customers');
  }
}

export class MeetingRepository extends BaseRepository<Meeting> {
  constructor() {
    super('meetings');
  }
}

export class FileRepository extends BaseRepository<FileItem> {
  constructor() {
    super('files');
  }
}

export class NotificationRepository extends BaseRepository<Notification> {
  constructor() {
    super('notifications');
  }
}

export class AutomationRepository extends BaseRepository<AutomationWorkflow> {
  constructor() {
    super('automations');
  }
}

export class SettingsRepository extends BaseRepository<ProviderSetting> {
  constructor() {
    super('providerSettings');
  }
}

export class AiAnalysisRepository extends BaseRepository<AiAnalysis> {
  constructor() {
    super('aiAnalysis');
  }
}

// Instantiate and export Repository singletons
export const userRepository = new UserRepository();
export const emailRepository = new EmailRepository();
export const mailAccountRepository = new MailAccountRepository();
export const taskRepository = new TaskRepository();
export const projectRepository = new ProjectRepository();
export const customerRepository = new CustomerRepository();
export const contactRepository = new ContactRepository();
export const meetingRepository = new MeetingRepository();
export const fileRepository = new FileRepository();
export const notificationRepository = new NotificationRepository();
export const automationRepository = new AutomationRepository();
export const settingsRepository = new SettingsRepository();
export const aiAnalysisRepository = new AiAnalysisRepository();
