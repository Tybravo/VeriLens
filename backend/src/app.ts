import express from "express";
import cors from "cors";
import manifestRoutes from "./routes/manifest.routes";
import { env } from "./config/env";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/manifest", manifestRoutes);

export default app;
