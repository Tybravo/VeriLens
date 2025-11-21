import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import { suiClient } from "../suiClient";
import { ENV } from "../env";
import { getSigner } from "../helpers/getSigner";
import { getAddress } from "../helpers/getAddress";

const vecFromString = (s: string) => bcs.vector(bcs.U8).serialize(Array.from(new TextEncoder().encode(s)));

export const submitMockAttestation = async ({
  mediaBlobId,
  manifestBlobId,
  verified = true,
}: {
  mediaBlobId: string;
  manifestBlobId: string;
  verified?: boolean;
}) => {
  if (!ENV.PACKAGE_ID) throw new Error("PACKAGE_ID is not set in env");
  if (!ENV.ORACLE_CONFIG_ID) throw new Error("ORACLE_CONFIG_ID is not set in env");
  if (!ENV.DEV_MINT_CAP_ID) throw new Error("DEV_MINT_CAP_ID is not set in env");

  const tx = new Transaction();

  const ownerAddr = getAddress({ secretKey: ENV.USER_SECRET_KEY });
  const mediaVec = vecFromString(mediaBlobId);
  const manifestVec = vecFromString(manifestBlobId);
  const proverVec = vecFromString("mock_prover");
  const contentHashVec = vecFromString("mock_content_hash");
  const manifestHashVec = vecFromString("mock_manifest_hash");

  tx.moveCall({
    target: `${ENV.PACKAGE_ID}::verilens_oracle::submit_mock_attestation`,
    arguments: [
      tx.object(ENV.DEV_MINT_CAP_ID!),
      tx.object(ENV.ORACLE_CONFIG_ID!),
      tx.pure(mediaVec),
      tx.pure(manifestVec),
      tx.pure(proverVec),
      tx.pure(contentHashVec),
      tx.pure(manifestHashVec),
      tx.pure.bool(verified),
      tx.object("0x6"), // Clock
      tx.pure.address(ownerAddr),
    ],
  });

  const res = await suiClient.signAndExecuteTransaction({
    transaction: tx,
    signer: getSigner({ secretKey: ENV.USER_SECRET_KEY }),
    options: { showEffects: true, showObjectChanges: true },
  });

  return res;
};

