import fs from "fs";
import crypto from "crypto";

const main = async () => {
  const args = process.argv.slice(2);
  const flags = Object.fromEntries(args.map((a) => a.split("=", 2)).filter(([k, v]) => k && v));
  const file = flags["file"] ?? args[0];
  if (!file) throw new Error("Provide a file path");
  const buf = fs.readFileSync(file);
  const hex = crypto.createHash("sha256").update(new Uint8Array(buf)).digest("hex");
  console.log(hex);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
