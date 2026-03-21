/**
 * Decoded Firebase token payload attached to the request
 * after FirebaseAuthGuard verification.
 */
export interface FirebaseUser {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified: boolean;
  auth_provider: string; // 'password' | 'google.com'
}
