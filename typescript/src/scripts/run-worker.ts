import { runVerificationWorker } from "../workers/verificationWorker";

runVerificationWorker({ intervalMs: 10000 }).catch((e) => {
  console.error(e);
  process.exit(1);
});

