import app from "./app";
import { env } from "../src/config/env";

app.listen(env.PORT, () => {
  console.log(`VeriLens backend running on port ${env.PORT}`);
});
