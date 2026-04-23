export const ANONYMOUS_SESSION_COOKIE = "formulalab_anonymous_session";
export const ANONYMOUS_SESSION_MAX_AGE = 60 * 60 * 24 * 365;
export const AUTH_SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
] as const;
