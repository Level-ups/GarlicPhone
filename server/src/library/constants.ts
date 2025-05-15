export const constants = {
  LOBBY_CODE_LENGTH: parseIntOrDefault(process.env.LOBBY_CODE_LENGTH, 6),
  MINIMUM_PLAYERS: parseIntOrDefault(process.env.MINIMUM_PLAYERS, 2),
  MAXIMUM_PLAYERS: parseIntOrDefault(process.env.MAXIMUM_PLAYERS, 10),
  AWS_REGION: process.env.AWS_REGION!,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID!,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY!,
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME!,
  EC2_HOST: process.env.EC2_HOST!,
  EC2_USER: process.env.EC2_USER!,
  PG_DATABASE: process.env.PG_DATABASE!,
  DB_USERNAME: process.env.DB_USERNAME!,
  DB_PASSWORD: process.env.DB_PASSWORD!,
  PG_HOST: process.env.PG_HOST!,
  PG_PORT: parseIntOrDefault(process.env.PG_PORT, 5432),
  PORT: parseIntOrDefault(process.env.PORT, 5000),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
  GOOGLE_CLIENT_REDIRECT_URI: process.env.GOOGLE_CLIENT_REDIRECT_URI!,
  GOOGLE_CLIENT_SCOPES: process.env.GOOGLE_CLIENT_SCOPES ?? 'openid profile email',
  GOOGLE_CLIENT_AUTH_URL: process.env.GOOGLE_CLIENT_AUTH_URL ?? 'https://accounts.google.com/o/oauth2/v2/auth',
  FRONTEND_URL: process.env.FRONTEND_URL!,
  ROUND_LENGTH_MILLISECONDS: parseIntOrDefault(process.env.ROUND_LENGTH_MILLISECONDS, 30000)
}

function parseIntOrDefault(value: string | undefined, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  } else {
    return parseInt(value);
  }
}