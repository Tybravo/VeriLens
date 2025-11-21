import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import { fromHEX } from "@mysten/sui/utils";
import { suiClient } from "../suiClient";
import { ENV } from "../env";
import { getSigner } from "../helpers/getSigner";
import { getAddress } from "../helpers/getAddress";

const vecFromString = (s: string) => bcs.vector(bcs.U8).serialize(Array.from(new TextEncoder().encode(s)));
const vecFromHex = (hex: string) => bcs.vector(bcs.U8).serialize(Array.from(fromHEX(hex)));

export type SubmitAttestationInput = {
  oracleConfigId: string;
  mediaBlobId: string;
  manifestBlobId: string;
  proverTeeId: string;
  contentHashHex: string;
  manifestHashHex: string;
  codeHashHex: string;
  verified: boolean;
  signatureHex: string;
  ownerAddress?: string;
};

export const submitAttestation = async (input: SubmitAttestationInput) => {
  if (!ENV.PACKAGE_ID) throw new Error("PACKAGE_ID is not set in env");
  const cfgId = input.oracleConfigId || ENV.ORACLE_CONFIG_ID;
  if (!cfgId) throw new Error("ORACLE_CONFIG_ID is not set in env or input");

  const tx = new Transaction();

  const ownerAddr = input.ownerAddress ?? getAddress({ secretKey: ENV.USER_SECRET_KEY });

  const mediaVec = vecFromString(input.mediaBlobId);
  const manifestVec = vecFromString(input.manifestBlobId);
  const proverVec = vecFromString(input.proverTeeId);
  const contentHashVec = vecFromHex(input.contentHashHex);
  const manifestHashVec = vecFromHex(input.manifestHashHex);
  const codeHashVec = vecFromHex(input.codeHashHex);
  const signatureVec = vecFromHex(input.signatureHex);

  tx.moveCall({
    target: `${ENV.PACKAGE_ID}::verilens_oracle::submit_attestation`,
    arguments: [
      tx.object(cfgId),
      tx.pure(mediaVec),
      tx.pure(manifestVec),
      tx.pure(proverVec),
      tx.pure(contentHashVec),
      tx.pure(manifestHashVec),
      tx.pure(codeHashVec),
      tx.pure.bool(input.verified),
      tx.pure(signatureVec),
      tx.object("0x6"),
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

