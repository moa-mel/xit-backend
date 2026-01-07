import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { join } from 'path';
import { config } from 'dotenv';

config();

@Injectable()
export class FirebaseService {
  private db: admin.database.Database;
}