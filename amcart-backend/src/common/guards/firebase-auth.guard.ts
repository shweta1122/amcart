import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseUser } from '../interfaces/firebase-user.interface';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
      const decoded = await admin.auth().verifyIdToken(idToken);

      // Attach a clean FirebaseUser object to the request
      const firebaseUser: FirebaseUser = {
        uid: decoded.uid,
        email: decoded.email || '',
        name: decoded.name || decoded.displayName || undefined,
        picture: decoded.picture || undefined,
        email_verified: decoded.email_verified || false,
        auth_provider: decoded.firebase?.sign_in_provider || 'unknown',
      };

      request.user = firebaseUser;
      return true;
    } catch (error) {
      this.logger.warn(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired Firebase token');
    }
  }
}
