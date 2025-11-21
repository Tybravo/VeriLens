import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import { fromHEX } from "@mysten/sui/utils";
import { ENV } from "../env";
import { suiClient } from "../suiClient";
import { getSigner } from "../helpers/getSigner";
import {
  validateExpectedCodeHash,
  validateCompressedSecp256k1Pubkey,
} from "../helpers/validation";

export const updateOracleConfig = async (
  expectedCodeHashHex: string,
  trustedPubkeyHex: string
): Promise<{ digest: string }> => {
  if (!ENV.PACKAGE_ID) throw new Error("PACKAGE_ID is not set in env");
  if (!ENV.ORACLE_CONFIG_ID) throw new Error("ORACLE_CONFIG_ID is not set in env");

  const expected = validateExpectedCodeHash(expectedCodeHashHex);
  const pubkey = validateCompressedSecp256k1Pubkey(trustedPubkeyHex);

  const expectedVec = bcs
    .vector(bcs.U8)
    .serialize(Array.from(fromHEX(expected)));
  const pubkeyVec = bcs
    .vector(bcs.U8)
    .serialize(Array.from(fromHEX(pubkey)));

  const tx = new Transaction();
  tx.moveCall({
    target: `${ENV.PACKAGE_ID}::verilens_oracle::update_config`,
    arguments: [
      tx.object(ENV.ORACLE_CONFIG_ID!),
      tx.pure(expectedVec),
      tx.pure(pubkeyVec),
    ],
  });

  const res = await suiClient.signAndExecuteTransaction({
    transaction: tx,
    signer: getSigner({ secretKey: ENV.USER_SECRET_KEY }),
    options: { showEffects: true },
  });

  const digest = (res as any).digest ?? res.effects?.transactionDigest ?? "";
  return { digest };
};

