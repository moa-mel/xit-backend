import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { join } from 'path';
import { config } from 'dotenv';
import { serviceAccount } from '@/config/constant';

config();

@Injectable()
export class FirebaseService {
  private db: admin.database.Database;

  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount
        ),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }

    this.db = admin.database();
  }

  async sendRealtimeUpdate(path: string, data: any): Promise<void> {
    await this.db.ref(path).push(data);
  }
}