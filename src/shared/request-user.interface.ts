/**
 * The minimal user context attached to every authenticated request.
 * Derived from the validated JWT payload by JwtStrategy.
 */
export interface RequestUser {
  id: string;
  email: string;
}
