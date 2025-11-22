import dotenv from "dotenv";

dotenv.config();

// Define required environment variables
const requiredEnv = ["PORT"];

// Validate required environment variables
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Export strongly-typed configuration
export const env = {
  PORT: Number(process.env.PORT || 4000),
  NODE_ENV: process.env.NODE_ENV || "development",
};
