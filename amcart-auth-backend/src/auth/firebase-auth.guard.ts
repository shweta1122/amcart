import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { UserService } from '../user/user.service';

/**
 * FirebaseAuthGuard
 * ─────────────────────────────────────────────
 * Verifies the Firebase ID token from the
 * Authorization: Bearer <token> header.
 *
 * On success, calls userService.syncFirebaseUser()
 * to find/create the user in PostgreSQL, then
 * attaches the local DB user to req.user.
 *
 * Usage:
 *   @UseGuards(FirebaseAuthGuard)
 *   @Get('profile')
 *   getProfile(@Req() req) { return req.user; }
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const decoded = await admin.auth().verifyIdToken(token);

      // Determine auth provider from Firebase token
      const authProvider =
        decoded.firebase?.sign_in_provider || 'password';

      // Sync with local DB using your existing UserService method
      const user = await this.userService.syncFirebaseUser({
        uid: decoded.uid,
        email: decoded.email || '',
        email_verified: decoded.email_verified || false,
        name: decoded.name || '',
        picture: decoded.picture || '',
        auth_provider: authProvider,
      });

      // Attach local DB user to request
      request.user = user;

      return true;
    } catch (error) {
      this.logger.warn(`Firebase auth failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}