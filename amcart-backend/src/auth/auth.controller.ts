import {
  Controller,
  Get,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FirebaseUser } from '../common/interfaces/firebase-user.interface';
import { UserService } from '../user/user.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  /**
   * POST /api/auth/sync
   *
   * Called by the frontend immediately after Firebase login/signup.
   * Verifies the Firebase token and upserts the user in PostgreSQL.
   */
  @Post('sync')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({ summary: 'Sync Firebase user to local database' })
  @ApiResponse({ status: 200, description: 'User synced successfully' })
  @ApiResponse({ status: 401, description: 'Invalid Firebase token' })
  async syncUser(@CurrentUser() firebaseUser: FirebaseUser) {
    const user = await this.userService.syncFirebaseUser(firebaseUser);
    return {
      message: 'User synced successfully',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        role: user.role,
        authProvider: user.authProvider,
        emailVerified: user.emailVerified,
      },
    };
  }

  /**
   * GET /api/auth/profile
   *
   * Returns the current user's profile from the local database.
   */
  @Get('profile')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  @ApiResponse({ status: 401, description: 'Invalid Firebase token' })
  async getProfile(@CurrentUser() firebaseUser: FirebaseUser) {
    const user = await this.userService.findByFirebaseUid(firebaseUser.uid);

    if (!user) {
      // Edge case: token valid but user never synced — sync now
      const synced = await this.userService.syncFirebaseUser(firebaseUser);
      return { user: synced };
    }

    return { user };
  }

  /**
   * GET /api/health
   * Public endpoint — no auth needed.
   */
  @Get('/health')
  @ApiOperation({ summary: 'Health check' })
  healthCheck() {
    return { status: 'ok', service: 'amcart-auth', timestamp: new Date().toISOString() };
  }
}
