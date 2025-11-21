## Overview
- Use Nautilus to run the C2PA verifier inside an AWS Nitro Enclave and verify the AWS-signed attestation on-chain.
- Your Move module already enforces `code_hash` equality and secp256k1 signature verification in `submit_attestation` (verilens/verilens_oracle/sources/verilens_oracle.move:104–152).
- Backend generates `expected_code_hash` (SHA-256 of the verifier binary) and `trusted_pubkey` (compressed secp256k1) from the enclave setup; frontend submits `request_verification`, and UI polls until a `ProvenanceCertificate` is minted.

## Inputs for create_config
- Build the enclave using the Nautilus template; obtain the verifier binary and enclave public key from helper scripts.
- Compute SHA-256 of the verifier binary → `expected_code_hash`.
- Use compressed secp256k1 enclave public key → `trusted_pubkey`.
- Pass both to the TypeScript wrapper `createOracleConfig` which calls `verilens_oracle::create_config` (typescript/src/oracle/createConfig.ts:14–47).

## Key Repo Integration Points
- Smart contract
  - `create_config` (verilens/verilens_oracle/sources/verilens_oracle.move:81–88) stores trusted parameters on-chain.
  - `submit_attestation` (verilens/verilens_oracle/sources/verilens_oracle.move:104–152) validates `code_hash` and `signature`, then mints `ProvenanceCertificate`.
  - `VerificationRequestEvent` (verilens/verilens_oracle/sources/verilens_oracle.move:69–79) anchors user intent on-chain.
- Backend TypeScript
  - Sui client/env/signing (typescript/src/suiClient.ts:4–6, typescript/src/env.ts:6–13, typescript/src/helpers/getSigner.ts).
  - Config creation wrapper (typescript/src/oracle/createConfig.ts).
  - Mock attestation example (typescript/src/oracle/submitMockAttestation.ts) — use as a template for the real attestation client.
- Frontend
  - Upload and `request_verification` submission (frontend/src/app/creator/upload-content/page.tsx:97–129).
  - Event lookup from transaction digest (frontend/src/app/creator/upload-content/page.tsx:131–139).

## Enclave Setup (Nautilus)
- Clone `MystenLabs/nautilus` and follow:
  - `UsingNautilus.md`: full workflow and scripts.
  - `Configure_enclave.sh`: prepares environment and generates keys.
  - `Register_enclave.sh`: registers/prints attestation artifacts (binary path, enclave pubkey).
- Produce:
  - `expected_code_hash`: SHA-256 of the verifier binary.
  - `trusted_pubkey`: compressed secp256k1 pubkey (02/03 + 64 hex chars).
- Note: the reproducible template is a starting point and comes without warranty; adapt for your verifier.

## Backend Orchestration
- Location: extend the existing TypeScript utilities to add a production `submitAttestation` client and a small worker to consume on-chain requests.
- New modules (suggested):
  - `typescript/src/oracle/submitAttestation.ts`
    - Inputs: `oracleConfigId`, Walrus `mediaBlobId`, `manifestBlobId`, `prover_ttee_id`, `content_hash`, `manifest_hash`, `code_hash` (same as `expected_code_hash`), `verified`, `signature`, `owner`.
    - Builds BCS vectors exactly like `submitMockAttestation` (typescript/src/oracle/submitMockAttestation.ts:25–46) but calls `verilens_oracle::submit_attestation`.
  - `typescript/src/workers/verificationWorker.ts`
    - Subscribes to `VerificationRequestEvent` using `SuiClient.queryEvents`.
    - For each event: fetch blobs from Walrus, run verifier inside the enclave, compute `content_hash`/`manifest_hash`, build attestation message as in Move (verilens/verilens_oracle/sources/verilens_oracle.move:193–213), sign with enclave key, then call `submitAttestation`.
  - `typescript/src/services/enclaveBridge.ts`
    - Wraps Nautilus scripts/binaries: executes the verifier inside the enclave, returns `{ verified, content_hash, manifest_hash, prover_ttee_id, signature }`.
- Environment
  - Ensure `ENV.PACKAGE_ID`, `ENV.ORACLE_CONFIG_ID`, `ENV.SUI_NETWORK`, `ENV.USER_SECRET_KEY` are set (typescript/src/env.ts:6–13).
  - Add any necessary settings for the enclave bridge (paths, host URLs) via `.env`.

## Frontend API (optional fallback)
- Add Next.js App Router handler at `frontend/src/app/api/verify/submit/route.ts`:
  - Accepts `multipart/form-data` for media/manifest when Walrus upload fails client-side.
  - Performs the Walrus uploads server-side and returns `{ walrusMediaId, walrusManifestId, jobId }` (shape already used in page.tsx:12–17).
  - Does not submit on-chain transactions; the user triggers `request_verification` from the UI.

## UI Polling for Certificate
- Goal: show “Certificate minted” when the attestation transaction mints `ProvenanceCertificate`.
- Approach (no contract changes): poll for a certificate owned by the user with matching blob IDs.
  - After `request_verification` succeeds (frontend/src/app/creator/upload-content/page.tsx:781–807), start a `react-query` poll keyed by `["certificate", walrusMediaId, walrusManifestId, currentAccount.address]`.
  - Every 5–10s:
    - Call `suiClient.getOwnedObjects({ owner: currentAccount.address, filter: { MatchAny: [{ StructType: `${VERILENS_PACKAGE_ID}::verilens_oracle::ProvenanceCertificate` }] } })`.
    - For each object, `getObject({ id, options: { showContent: true } })` and check `media_blob_id` and `manifest_blob_id` fields for exact match.
  - When a match is found, display “Certificate minted” and link to `https://suiexplorer.com/object/<certificateId>?network=<network>`.
- Optional enhancement (contract change): add `CertificateMintedEvent` in Move emitted from `submit_attestation`, then use `queryEvents({ query: { MoveEventType: `${VERILENS_PACKAGE_ID}::verilens_oracle::CertificateMintedEvent` } })` filtered by requester/owner for lower-latency detection.

## Attestation Message Parity
- Ensure the off-chain message bytes exactly match Move’s `build_attestation_message` (verilens/verilens_oracle/sources/verilens_oracle.move:193–213):
  - BCS length-prefixed concatenation of: `blob_id_content`, `blob_id_manifest`, `prover_ttee_id`, `content_hash`, `manifest_hash`, `code_hash`, and a final single byte `verified` (1 or 0).
  - Hash with Keccak256, sign with secp256k1; provide signature bytes expected by `ecdsa_k1::secp256k1_verify` (verilens/verilens_oracle/sources/verilens_oracle.move:132–138).

## Verification & Testing
- Backend unit tests:
  - Vector serialization and Keccak256 hash equality against Move: compare TypeScript-computed hash with on-chain `attestation_hash` from a dev transaction.
  - Validate input formats using existing helpers (typescript/src/helpers/validation.ts:3–21).
- Manual checks:
  - `create_config` returns an `OracleConfig` id (typescript/src/oracle/createConfig.ts:41–47).
  - `submit_attestation` transaction shows a created `ProvenanceCertificate` object in effects.
  - UI shows “Certificate minted” with a working explorer link.

## Step-by-Step Execution Summary
1. Build and register the Nautilus enclave; record `expected_code_hash` and `trusted_pubkey`.
2. Call `createOracleConfig(expected_code_hash, trusted_pubkey)` to create the on-chain config and store the object id.
3. In the UI, upload to Walrus and call `request_verification(blob_id_content, blob_id_manifest)`.
4. The backend worker detects the event, runs enclave verification, builds and signs the attestation message, then calls `submit_attestation`.
5. The frontend polls for a `ProvenanceCertificate` owned by the user with matching blob IDs and updates the UI with “Certificate minted” and a link.

## Deliverables
- Backend attestation client and worker integrated with Sui events and the enclave outputs.
- Optional Next.js API route for Walrus upload fallback.
- Frontend polling and UI status/link for the minted certificate.
- Documentation snippets explaining how to obtain `expected_code_hash` and `trusted_pubkey` from the Nautilus template and wire them into `create_config`.