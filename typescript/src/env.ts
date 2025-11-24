import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  SUI_NETWORK: z.string(),
  PACKAGE_ID: z.string().optional(),
  HEROES_REGISTRY_ID: z.string().optional(),
  USER_SECRET_KEY: z.string(),
  ORACLE_CONFIG_ID: z.string().optional(),
  DEV_MINT_CAP_ID: z.string().optional(),
});

// Parse and validate the environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(parsedEnv.error.format(), null, 2)
  );
  if (!process.env.JEST_WORKER_ID) {
    process.exit(1);
  }
}

export const ENV = parsedEnv.success ? parsedEnv.data : ({} as any);
