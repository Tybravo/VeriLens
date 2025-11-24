import app from "./app";
import { env } from "./config/env";

app.listen(env.PORT, () => {
  console.log(`VeriLens backend running on port ${env.PORT}`);
});
