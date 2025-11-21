import { NextResponse } from "next/server";
import { keccak_256 } from "@noble/hashes/sha3";
import { sha256 } from "@noble/hashes/sha256";
import * as secp from "@noble/secp256k1";

import { readFile } from "fs/promises";

export const runtime = "nodejs";

const textEncoder = new TextEncoder();

const getWalrusUrls = (network: string) => {
  const isMainnet = network === "mainnet";
  return {
    aggregatorUrl: isMainnet
      ? "https://aggregator.walrus.space"
      : "https://aggregator.walrus-testnet.walrus.space",
  };
};

const toHex = (bytes: Uint8Array) => Buffer.from(bytes).toString("hex");
const fromHex = (hex: string) => new Uint8Array(Buffer.from(hex, "hex"));

const sha256Hex = (data: Uint8Array) => toHex(sha256(data));

const bcsU64LE = (n: number) => {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(n));
  return new Uint8Array(buf);
};

const appendWithLen = (dest: number[], data: Uint8Array) => {
  const len = bcsU64LE(data.length);
  for (const b of len) dest.push(b);
  for (const b of data) dest.push(b);
};

const buildAttestationMessage = (args: {
  mediaBlobId: string;
  manifestBlobId: string;
  proverTeeId: string;
  contentHashBytes: Uint8Array;
  manifestHashBytes: Uint8Array;
  codeHashBytes: Uint8Array;
  verified: boolean;
}) => {
  const out: number[] = [];
  appendWithLen(out, textEncoder.encode(args.mediaBlobId));
  appendWithLen(out, textEncoder.encode(args.manifestBlobId));
  appendWithLen(out, textEncoder.encode(args.proverTeeId));
  appendWithLen(out, args.contentHashBytes);
  appendWithLen(out, args.manifestHashBytes);
  appendWithLen(out, args.codeHashBytes);
  out.push(args.verified ? 1 : 0);
  return new Uint8Array(out);
};

async function fetchWalrusBlobBytes(blobId: string, network: string): Promise<Uint8Array> {
  const { aggregatorUrl } = getWalrusUrls(network);
  const url = `${aggregatorUrl}/v1/blobs/${blobId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Walrus fetch failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

async function resolveCodeHashHex(): Promise<string> {
  const path = process.env.VERIFIER_BIN_PATH || "";
  if (path) {
    try {
      const bytes = await readFile(path);
      return toHex(sha256(new Uint8Array(bytes)));
    } catch (_) {}
  }
  const hex = (process.env.EXPECTED_CODE_HASH || "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hex)) throw new Error("EXPECTED_CODE_HASH must be 64-hex SHA-256");
  return hex;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mediaBlobId = (body?.mediaBlobId || "").toString();
    const manifestBlobId = (body?.manifestBlobId || "").toString();
    if (!mediaBlobId || !manifestBlobId) {
      return NextResponse.json({ message: "Missing blob IDs" }, { status: 400 });
    }

    const network = (process.env.WALRUS_NETWORK || "testnet").toLowerCase();
    const proverTeeId = process.env.PROVER_TEE_ID || "nautilus_tee";

    const mediaBytes = await fetchWalrusBlobBytes(mediaBlobId, network);
    const manifestBytes = await fetchWalrusBlobBytes(manifestBlobId, network);

    const contentHashHex = sha256Hex(mediaBytes);
    const manifestHashHex = sha256Hex(manifestBytes);

    const codeHashHex = await resolveCodeHashHex();

    const contentHashBytes = fromHex(contentHashHex);
    const manifestHashBytes = fromHex(manifestHashHex);
    const codeHashBytes = fromHex(codeHashHex);

    const verified = true;
    const message = buildAttestationMessage({
      mediaBlobId,
      manifestBlobId,
      proverTeeId,
      contentHashBytes,
      manifestHashBytes,
      codeHashBytes,
      verified,
    });

    const msgHash = keccak_256(message);

    const privHex = (process.env.TEE_PRIVATE_KEY_HEX || "").toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(privHex)) {
      return NextResponse.json({ message: "TEE_PRIVATE_KEY_HEX must be 32-byte hex" }, { status: 500 });
    }
    const signatureResult = await secp.signAsync(msgHash, privHex);
    const signatureHex = toHex(signatureResult.toBytes());

    return NextResponse.json({
      contentHashHex,
      manifestHashHex,
      codeHashHex,
      signatureHex,
      proverTeeId,
    });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Attestation failed" }, { status: 500 });
  }
}
