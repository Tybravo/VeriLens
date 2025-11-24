import fs from "fs";
import path from "path";

const upsertEnvFile = (filePath: string, updates: Record<string, string>) => {
  let existing = "";
  if (fs.existsSync(filePath)) {
    existing = fs.readFileSync(filePath, "utf8");
  }
  const lines = existing.split(/\r?\n/).filter(Boolean);
  const map = new Map<string, string>();
  for (const l of lines) {
    const idx = l.indexOf("=");
    if (idx > 0) {
      const k = l.slice(0, idx);
      const v = l.slice(idx + 1);
      map.set(k, v);
    }
  }
  for (const [k, v] of Object.entries(updates)) {
    map.set(k, v);
  }
  const out = Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n";
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, out, "utf8");
};

export const storeIdsToEnv = ({
  packageId,
  oracleConfigId,
  devMintCapId,
}: {
  packageId?: string;
  oracleConfigId?: string;
  devMintCapId?: string;
}) => {
  const root = path.resolve(__dirname, "../../..");
  const tsEnv = path.join(root, "typescript/.env");
  const feEnv = path.join(root, "frontend/.env.local");

  const updatesScript: Record<string, string> = {};
  const updatesFrontend: Record<string, string> = {};

  if (packageId) {
    updatesScript["PACKAGE_ID"] = packageId;
    updatesFrontend["NEXT_PUBLIC_VERILENS_PACKAGE_ID"] = packageId;
  }
  if (oracleConfigId) {
    updatesScript["ORACLE_CONFIG_ID"] = oracleConfigId;
    updatesFrontend["NEXT_PUBLIC_ORACLE_CONFIG_ID"] = oracleConfigId;
  }
  if (devMintCapId) {
    updatesScript["DEV_MINT_CAP_ID"] = devMintCapId;
    updatesFrontend["NEXT_PUBLIC_DEV_MINT_CAP_ID"] = devMintCapId;
  }

  if (Object.keys(updatesScript).length) upsertEnvFile(tsEnv, updatesScript);
  if (Object.keys(updatesFrontend).length) upsertEnvFile(feEnv, updatesFrontend);
};

