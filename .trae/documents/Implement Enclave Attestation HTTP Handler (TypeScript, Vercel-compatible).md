## Overview
- Add an internal HTTP endpoint that takes Walrus blob IDs and returns attestation artifacts required by on-chain `submit_attestation`.
- Use a Next.js App Router API route so it runs on Vercel and stays consistent with the existing `frontend/src/app/api/...` handlers.
- Keep the `typescript` worker unchanged and point `NAUTILUS_ENDPOINT` to this endpoint.

## Endpoint Contract
- Path: `frontend/src/app/api/enclave/attest/route.ts`
- Method: `POST`, content type `application/json`
- Request JSON: `{ "mediaBlobId": string, "manifestBlobId": string }`
- Response JSON (exact keys):
  `{ "contentHashHex": string, "manifestHashHex": string, "codeHashHex": string, "signatureHex": string, "proverTeeId": string }`
- Errors: JSON with `message` and appropriate HTTP status codes.

## Cryptography Implementation
- Content/manifest SHA-256:
  - Fetch bytes from Walrus Aggregator `GET {aggregatorUrl}/v1/blobs/{blobId}` and hash with SHA-256.
  - Aggregator URLs follow existing pattern used in repo: testnet `https://aggregator.walrus-testnet.walrus.space`, mainnet `https://aggregator.walrus.space` ([Walrus HTTP API docs](https://docs.wal.app/usage/web-api.html)).
- Enclave code hash:
  - If `VERIFIER_BIN_PATH` is set and readable, hash file bytes with SHA-256.
  - Else use `EXPECTED_CODE_HASH` (validated as 64-hex) to preserve current flow in `typescript/src/services/enclaveBridge.ts:21–25,67–68`.
- Attestation message construction (Move parity):
  - Build message exactly like `verilens/verilens_oracle/sources/verilens_oracle.move:193–213` using BCS u64 length prefixes for each vector and a final single byte for `verified`.
  - Order: `mediaBlobId` bytes, `manifestBlobId` bytes, `proverTeeId` bytes, `contentHash` bytes, `manifestHash` bytes, `codeHash` bytes, `verified` flag.
- Message hash and signature:
  - Keccak256 over the constructed message (matches `verilens_oracle.move:130`).
  - Sign the Keccak256 digest with secp256k1 using enclave private key from `TEE_PRIVATE_KEY_HEX`.
  - Produce a 64-byte raw signature (r||s) as hex to match on-chain `ecdsa_k1::secp256k1_verify(&signature, &trusted_pubkey, &msg_hash, 0)` at `verilens_oracle.move:132–138`.

## Libraries
- `@noble/hashes` for `sha256` and `keccak_256`.
- `@noble/secp256k1` for secp256k1 signing.
- Node `crypto` fallback for SHA-256 if preferable in Node runtime.

## Vercel Compatibility
- Implement as Next.js App Router route using `next/server` `POST(req: Request)`.
- Avoid Node-only APIs in Edge runtime; run in Node serverless runtime.
- Streaming fetch for Walrus blob download to avoid large memory usage; fallback to `arrayBuffer()` if needed.

## Worker Integration
- Keep `typescript/src/services/enclaveBridge.ts` unchanged.
- Configure `NAUTILUS_ENDPOINT` to point to the deployed route URL (e.g., `https://<vercel-app>/api/enclave/attest`).
- The endpoint returns fields `contentHashHex`, `manifestHashHex`, `codeHashHex`, `signatureHex`, `proverTeeId` that the worker already consumes.

## Config & Env
- `EXPECTED_CODE_HASH`: 64-hex SHA-256 of enclave verifier code (required if `VERIFIER_BIN_PATH` not set).
- `TEE_PRIVATE_KEY_HEX`: 32-byte secp256k1 private key hex used to sign attestation.
- `TRUSTED_TEE_PUBKEY_HEX`: compressed pubkey 66-hex (02/03+64) used on-chain; stored in the Move config via existing scripts, not read by this endpoint.
- `PROVER_TEE_ID`: string identifier returned in `proverTeeId`.
- `VERIFIER_BIN_PATH`: optional path to enclave/verifier binary to hash; if missing, use `EXPECTED_CODE_HASH`.
- `WALRUS_NETWORK`: `mainnet` or `testnet` to switch aggregator URL; default `testnet`.

## Security Notes
- Do not log private keys or signature material.
- Validate all hex inputs and outputs (64-hex for hashes, hex-only for signature).
- Consider adding an internal token header check later to restrict use.

## Files Added
- `frontend/src/app/api/enclave/attest/route.ts`: new handler implementing the contract and crypto.

## Implementation Outline
- Parse request JSON.
- Resolve aggregator URL from `WALRUS_NETWORK`.
- Download `mediaBlobId` and `manifestBlobId` bytes and compute SHA-256 hex for each.
- Resolve `codeHashHex` via file hash or `EXPECTED_CODE_HASH`.
- Encode attestation message:
  - UTF-8 bytes for ids and `proverTeeId`.
  - Raw 32-byte hashes for content, manifest, code hash.
  - BCS u64 length prefixes + append data; push `verified` byte `1`.
- Compute Keccak256 digest.
- Sign digest using `@noble/secp256k1` with `TEE_PRIVATE_KEY_HEX` to produce 64-byte hex `signatureHex`.
- Return JSON with required fields.

## Verification
- Manual test script: POST known Walrus blob IDs to the endpoint; confirm response shapes and lengths.
- Cross-check message construction parity by re-assembling in TS as bytes and comparing `keccak256` with building in Move in a local test (`verilens_oracle/tests/verilens_oracle_tests.move`) if desired.
- Submit an attestation on devnet pointing to this response using `typescript/src/oracle/submitAttestation.ts` and validate success.

## Architectural Consistency
- Mirrors existing Next.js API route style in `frontend/src/app/api/verify/submit/route.ts:11–49`.
- Keeps `typescript` worker unchanged and enables future Nautilus enclave integration by preserving the `NAUTILUS_ENDPOINT` interface.
- Endpoint can remain internal; it does not need to be exposed in the UI.