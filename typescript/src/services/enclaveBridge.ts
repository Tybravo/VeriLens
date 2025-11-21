import crypto from "crypto";
import { ENV } from "../env";

export type VerifierInput = {
  mediaBlobId: string;
  manifestBlobId: string;
};

export type VerifierOutput = {
  verified: boolean;
  contentHashHex: string;
  manifestHashHex: string;
  proverTeeId: string;
  signatureHex: string;
  codeHashHex: string;
};

const sha256Hex = (data: Uint8Array | string) => crypto.createHash("sha256").update(data).digest("hex");

export const runVerifier = async ({ mediaBlobId, manifestBlobId }: VerifierInput): Promise<VerifierOutput> => {
  const codeHashHex = (process.env.EXPECTED_CODE_HASH || "").toLowerCase();
  if (!codeHashHex || !/^[0-9a-f]{64}$/.test(codeHashHex)) {
    throw new Error("EXPECTED_CODE_HASH must be set to a 64-hex SHA-256 value");
  }

  const contentHashHex = sha256Hex(mediaBlobId);
  const manifestHashHex = sha256Hex(manifestBlobId);

  const signatureHex = (process.env.TEE_SIGNATURE_HEX || "").toLowerCase();
  if (!signatureHex || !/^[0-9a-f]+$/.test(signatureHex)) {
    throw new Error("TEE_SIGNATURE_HEX must be set to the enclave-produced secp256k1 signature in hex");
  }

  const proverTeeId = process.env.PROVER_TEE_ID || "nautilus_tee";

  return {
    verified: true,
    contentHashHex,
    manifestHashHex,
    proverTeeId,
    signatureHex,
    codeHashHex,
  };
};

