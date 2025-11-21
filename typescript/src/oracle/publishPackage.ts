import fs from "fs";
import path from "path";
import { Transaction } from "@mysten/sui/transactions";
import { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { suiClient } from "../suiClient";
import { ENV } from "../env";
import { storeIdsToEnv } from "../helpers/envStore";

const readCompiledModules = (buildDir: string): number[][] => {
  const modulesDir = path.join(buildDir, "modules");
  const files = fs.existsSync(modulesDir) ? fs.readdirSync(modulesDir) : [];
  return files
    .filter((f) => f.endsWith(".mv"))
    .map((f) => Array.from(fs.readFileSync(path.join(modulesDir, f))));
};

const readDependencies = (buildDir: string): string[] => {
  const depsFile = path.join(buildDir, "dependencies.json");
  if (fs.existsSync(depsFile)) {
    try {
      const json = JSON.parse(fs.readFileSync(depsFile, "utf8"));
      if (Array.isArray(json)) return json as string[];
    } catch {}
  }
  return [];
};

export const publishPackage = async (
  buildDir = path.resolve(__dirname, "../../../verilens/verilens_oracle/build")
): Promise<{ digest: string; packageId?: string }> => {
  const modules = readCompiledModules(buildDir);
  const dependencies = readDependencies(buildDir);
  if (!modules.length) throw new Error("No compiled modules found. Run `sui move build` first.");

  const tx = new Transaction();
  tx.publish({ modules, dependencies });

  const res: SuiTransactionBlockResponse = await suiClient.signAndExecuteTransaction({
    transaction: tx,
    signer: (await import("../helpers/getSigner")).getSigner({ secretKey: ENV.USER_SECRET_KEY }),
    options: { showEffects: true, showObjectChanges: true },
  });

  const digest = (res as any).digest ?? res.effects?.transactionDigest ?? "";
  // Heuristic: capture any created object that looks like a package ID
  const createdIds = (res.effects?.created ?? []).map((c: any) => c.reference?.objectId || c.objectId);
  const packageId = createdIds?.[0];
  if (packageId) storeIdsToEnv({ packageId });
  return { digest, packageId };
};
