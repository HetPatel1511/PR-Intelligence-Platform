import 'dotenv/config';

/**
 * Reads and types `process.env` once at startup. Required vars fail fast — a
 * missing value crashes here instead of surfacing as a confusing runtime error.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  DATABASE_URL: required('DATABASE_URL'),
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:5173',

  // Signs our own session JWTs.
  JWT_SECRET: required('JWT_SECRET'),
  // App JWT lifetime, in seconds. Default 7 days.
  JWT_EXPIRES_IN_SECONDS: Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 60 * 60 * 24 * 7),
  // Passphrase used to derive the AES key that encrypts GitHub tokens at rest.
  TOKEN_ENCRYPTION_KEY: required('TOKEN_ENCRYPTION_KEY'),

  // GitHub OAuth App credentials.
  GITHUB_CLIENT_ID: required('GITHUB_CLIENT_ID'),
  GITHUB_CLIENT_SECRET: required('GITHUB_CLIENT_SECRET'),
  GITHUB_CALLBACK_URL: required('GITHUB_CALLBACK_URL'),
  // Scopes requested at login. `read:user` for profile, `repo` to read PRs.
  GITHUB_SCOPES: process.env.GITHUB_SCOPES ?? 'read:user repo',

  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  },
} as const;
