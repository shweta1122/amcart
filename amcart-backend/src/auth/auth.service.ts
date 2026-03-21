import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    if (admin.apps.length > 0) {
      this.logger.log('Firebase Admin already initialized');
      return;
    }

    const serviceAccountPath = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');

    if (serviceAccountPath) {
      // Option 1: Load from JSON file
      const fullPath = path.resolve(serviceAccountPath);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Firebase service account file not found: ${fullPath}`);
      }

      const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      this.logger.log('Firebase Admin initialized from service account file');
    } else if (projectId) {
      // Option 2: Load from individual env vars (for Docker/cloud)
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail: this.config.get<string>('FIREBASE_CLIENT_EMAIL'),
          privateKey: this.config
            .get<string>('FIREBASE_PRIVATE_KEY', '')
            .replace(/\\n/g, '\n'),
        }),
      });
      this.logger.log('Firebase Admin initialized from env variables');
    } else {
      throw new Error(
        'Firebase config missing. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY',
      );
    }
  }
}
