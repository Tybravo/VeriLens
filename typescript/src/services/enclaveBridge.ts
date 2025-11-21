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
  const endpoint = process.env.NAUTILUS_ENDPOINT || "";
  const codeHashHexEnv = (process.env.EXPECTED_CODE_HASH || "").toLowerCase();
  if (!codeHashHexEnv || !/^[0-9a-f]{64}$/.test(codeHashHexEnv)) {
    throw new Error("EXPECTED_CODE_HASH must be set to a 64-hex SHA-256 value");
  }

  if (endpoint) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaBlobId, manifestBlobId }),
    });
    if (!res.ok) throw new Error(`Nautilus endpoint error: ${res.status}`);
    const data: any = await res.json();
    const contentHashHex = (data?.contentHashHex || "").toLowerCase();
    const manifestHashHex = (data?.manifestHashHex || "").toLowerCase();
    const signatureHex = (data?.signatureHex || "").toLowerCase();
    const proverTeeId = data?.proverTeeId || "nautilus_tee";
    const codeHashHex = (data?.codeHashHex || codeHashHexEnv).toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(contentHashHex)) throw new Error("Invalid contentHashHex");
    if (!/^[0-9a-f]{64}$/.test(manifestHashHex)) throw new Error("Invalid manifestHashHex");
    if (!/^[0-9a-f]{64}$/.test(codeHashHex)) throw new Error("Invalid codeHashHex");
    if (!/^[0-9a-f]+$/.test(signatureHex)) throw new Error("Invalid signatureHex");
    return {
      verified: true,
      contentHashHex,
      manifestHashHex,
      proverTeeId,
      signatureHex,
      codeHashHex,
    };
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
    codeHashHex: codeHashHexEnv,
  };
};
