import { z } from "zod";

export const expectedCodeHashSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{64}$/);

export const compressedK1PubkeySchema = z
  .string()
  .regex(/^(02|03)[0-9a-fA-F]{64}$/);

export const validateExpectedCodeHash = (hex: string) => {
  const res = expectedCodeHashSchema.safeParse(hex);
  if (!res.success) throw new Error("Invalid expected_code_hash: must be 64 hex chars (SHA-256)");
  return res.data.toLowerCase();
};

export const validateCompressedSecp256k1Pubkey = (hex: string) => {
  const res = compressedK1PubkeySchema.safeParse(hex);
  if (!res.success) throw new Error("Invalid trusted_pubkey: must be 66 hex chars starting with 02/03");
  return res.data.toLowerCase();
};

