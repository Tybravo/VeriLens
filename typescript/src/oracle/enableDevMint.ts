import { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { ENV } from "../env";
import { suiClient } from "../suiClient";
import { extractCreatedId } from "../helpers/parseObjectChanges";
import { storeIdsToEnv } from "../helpers/envStore";

export const enableDevMint = async (): Promise<{ digest: string; devMintCapId: string }> => {
  if (!ENV.PACKAGE_ID) throw new Error("PACKAGE_ID is not set in env");

  const tx = new Transaction();
  tx.moveCall({ target: `${ENV.PACKAGE_ID}::verilens_oracle::enable_dev_mint` });

  const res: SuiTransactionBlockResponse = await suiClient.signAndExecuteTransaction({
    transaction: tx,
    signer: (await import("../helpers/getSigner")).getSigner({ secretKey: ENV.USER_SECRET_KEY }),
    options: { showEffects: true, showObjectChanges: true },
  });

  const digest = (res as any).digest ?? res.effects?.transactionDigest ?? "";
  const typeName = `${ENV.PACKAGE_ID}::verilens_oracle::DevMintCap`;
  const devMintCapId = extractCreatedId(res.objectChanges ?? undefined, typeName);
  if (!devMintCapId) throw new Error("DevMintCap object ID not found in object changes");

  storeIdsToEnv({ devMintCapId });
  return { digest, devMintCapId };
};
