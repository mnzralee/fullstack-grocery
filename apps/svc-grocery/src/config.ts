import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().int().min(1000).max(65535).default(3060),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  databaseUrl: z.string().min(1, 'DATABASE_URL is required'),
  jwtSecret: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('dev-secret-change-in-production-please'),
});

function loadConfig() {
  const result = configSchema.safeParse({
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
  });

  if (!result.success) {
    console.error('Configuration error:');
    result.error.errors.forEach((err) => {
      console.error(`  ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();
