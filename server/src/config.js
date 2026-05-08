import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-before-deploy',
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production'
};

if (!config.databaseUrl) {
  console.warn('DATABASE_URL is not set. Database calls will fail until it is configured.');
}
