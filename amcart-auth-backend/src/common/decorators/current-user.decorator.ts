import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FirebaseUser } from '../interfaces/firebase-user.interface';

/**
 * Extract the authenticated Firebase user from the request.
 * Usage: @CurrentUser() user: FirebaseUser
 */
export const CurrentUser = createParamDecorator(
  (data: keyof FirebaseUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as FirebaseUser;
    return data ? user?.[data] : user;
  },
);
