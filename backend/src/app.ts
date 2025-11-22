import express from "express";
import manifestRoutes from "./routes/manifest.routes";

const app = express();

app.use(express.json());

app.use("/api/manifest", manifestRoutes);

export default app;
