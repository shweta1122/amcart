import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AuthProvider } from './user.entity';
import { FirebaseUser } from '../common/interfaces/firebase-user.interface';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Find or create a user from a decoded Firebase token.
   * Called after every authenticated request to keep local DB in sync.
   */
  async syncFirebaseUser(firebaseUser: FirebaseUser): Promise<User> {
    let user = await this.userRepo.findOne({
      where: { firebaseUid: firebaseUser.uid },
    });

    if (user) {
      // Update fields that may have changed (e.g. profile pic, email verification)
      user.emailVerified = firebaseUser.email_verified;
      user.lastLoginAt = new Date();

      if (firebaseUser.picture && !user.photoUrl) {
        user.photoUrl = firebaseUser.picture;
      }
      if (firebaseUser.name && !user.displayName) {
        user.displayName = firebaseUser.name;
      }

      await this.userRepo.save(user);
      this.logger.log(`User synced: ${user.email}`);
      return user;
    }

    // Parse the display name into first/last
    const nameParts = (firebaseUser.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Determine auth provider
    const authProvider =
      firebaseUser.auth_provider === 'google.com'
        ? AuthProvider.GOOGLE
        : AuthProvider.EMAIL;

    user = this.userRepo.create({
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
      firstName,
      lastName,
      displayName: firebaseUser.name || firebaseUser.email,
      photoUrl: firebaseUser.picture || undefined,
      authProvider,
      emailVerified: firebaseUser.email_verified,
      lastLoginAt: new Date(),
    });

    await this.userRepo.save(user);
    this.logger.log(`New user created: ${user.email} via ${authProvider}`);
    return user;
  }

  async findByFirebaseUid(uid: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { firebaseUid: uid } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }
}
