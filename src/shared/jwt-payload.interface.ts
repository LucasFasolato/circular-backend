export interface JwtPayload {
  /** Subject — user UUID */
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}
