import { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import { fromHEX } from "@mysten/sui/utils";
import { ENV } from "../env";
import { suiClient } from "../suiClient";
import { extractCreatedId } from "../helpers/parseObjectChanges";
import { storeIdsToEnv } from "../helpers/envStore";
import {
  validateExpectedCodeHash,
  validateCompressedSecp256k1Pubkey,
} from "../helpers/validation";

export const createOracleConfig = async (
  expectedCodeHashHex: string,
  trustedPubkeyHex: string
): Promise<{ digest: string; oracleConfigId: string }> => {
  const expected = validateExpectedCodeHash(expectedCodeHashHex);
  const pubkey = validateCompressedSecp256k1Pubkey(trustedPubkeyHex);

  if (!ENV.PACKAGE_ID) throw new Error("PACKAGE_ID is not set in env");

  const expectedBytes = Array.from(fromHEX(expected));
  const pubkeyBytes = Array.from(fromHEX(pubkey));

  const expectedVec = bcs.vector(bcs.U8).serialize(expectedBytes);
  const pubkeyVec = bcs.vector(bcs.U8).serialize(pubkeyBytes);

  const tx = new Transaction();
  tx.moveCall({
    target: `${ENV.PACKAGE_ID}::verilens_oracle::create_config`,
    arguments: [tx.pure(expectedVec), tx.pure(pubkeyVec)],
  });

  const res: SuiTransactionBlockResponse = await suiClient.signAndExecuteTransaction({
    transaction: tx,
    signer: (await import("../helpers/getSigner")).getSigner({ secretKey: ENV.USER_SECRET_KEY }),
    options: { showEffects: true, showObjectChanges: true },
  });

  const digest = (res as any).digest ?? res.effects?.transactionDigest ?? "";
  const typeName = `${ENV.PACKAGE_ID}::verilens_oracle::OracleConfig`;
  const oracleConfigId = extractCreatedId(res.objectChanges ?? undefined, typeName);
  if (!oracleConfigId) throw new Error("OracleConfig object ID not found in object changes");

  storeIdsToEnv({ oracleConfigId });
  return { digest, oracleConfigId };
};
