## Overview
Implement end-to-end TypeScript tooling to publish the VeriLens Move package, create and store the Oracle configuration ID, optionally mint DevMint capabilities for testing, and expose all IDs to both the script environment and the Next.js frontend via env vars.

## Repository Context
- Frontend reads the package ID: `process.env.NEXT_PUBLIC_VERILENS_PACKAGE_ID` in `frontend/src/app/creator/upload-content/page.tsx:36`, used to call `request_verification` (`page.tsx:113`).
- TypeScript scripts already integrate Sui (`@mysten/sui`), have helpers and Jest setup:
  - Sui client: `typescript/src/suiClient.ts:4-6`
  - Env loader & zod validation: `typescript/src/env.ts:6-24`
  - Transaction parsing example: `typescript/src/helpers/parseCreatedObjectIds.ts:16-25`
  - E2E Jest example: `typescript/src/tests/e2e.test.ts:8-45`
- Move module defines `OracleConfig`, `DevMintCap`, and entry functions `create_config`, `enable_dev_mint`, etc.: `verilens/verilens_oracle/sources/verilens_oracle.move:81-102`

## Project Setup
1. Keep the existing `typescript` package as the integration surface; add a focused `oracle` folder for VeriLens-specific operations.
2. Extend env validation (`typescript/src/env.ts`) to include new keys:
   - `ORACLE_CONFIG_ID` (optional until created)
   - `DEV_MINT_CAP_ID` (optional, testing only)
   - `VERILENS_PACKAGE_ID` (optional until publish) for scripts; expose `NEXT_PUBLIC_VERILENS_PACKAGE_ID` for frontend.
3. Confirm Sui SDK versions across workspace: use `@mysten/sui@1.45.x` consistently where possible to match frontend.

## Package Publication
1. Implement `publishPackage.ts` under `typescript/src/oracle/`:
   - Inputs: path to compiled modules (from `sui move build`) under `verilens/verilens_oracle/build`.
   - Build a transaction: `tx.publish({ modules, dependencies })` with signer from `ENV.USER_SECRET_KEY`.
   - Execute via `suiClient.signAndExecuteTransaction` with `showEffects` and `showObjectChanges`.
   - Parse the resulting package ID from effects; write to:
     - Scripts env: `.env` → `PACKAGE_ID` (or `VERILENS_PACKAGE_ID` for clarity).
     - Frontend env: `frontend/.env.local` → `NEXT_PUBLIC_VERILENS_PACKAGE_ID`.
   - Log the package ID and return it to the caller.
2. Add a Jest test `publish.test.ts` that mocks the file read and asserts parsing logic; include an integration guard test that runs only if build artifacts exist locally.

## Create Oracle Configuration
1. Implement `createConfig.ts` under `typescript/src/oracle/`:
   - Inputs: `expected_code_hash` (hex string, 32-byte SHA-256 → 64 hex chars), `trusted_pubkey` (compressed secp256k1 pubkey, 33 bytes → 66 hex chars beginning with `02`/`03`).
   - Validation: `zod` schemas to enforce format and length; convert via `fromHEX` (Uint8Array) and serialize using `bcs.vector(bcs.U8)`.
   - Move call: `tx.moveCall({ target: `${ENV.PACKAGE_ID}::verilens_oracle::create_config`, arguments: [ expectedCodeHashVec, trustedPubkeyVec ] })`.
   - Sign/execute; parse `objectChanges` for a created object of type `${ENV.PACKAGE_ID}::verilens_oracle::OracleConfig`, extract `objectId`.
   - Persist `objectId` to:
     - Scripts `.env`: `ORACLE_CONFIG_ID`
     - Frontend `.env.local`: `NEXT_PUBLIC_ORACLE_CONFIG_ID`
   - Return `{ digest, oracleConfigId }`.
2. Add Jest tests `create-config.test.ts`:
   - Unit: invalid hex length/prefix errors (no network call).
   - Unit: parsing created object from a fixture `SuiTransactionBlockResponse`.
   - Integration: runs against configured `SUI_NETWORK` with a funded key; asserts success and ID shape.

## Enable Dev Mint (Optional)
1. Implement `enableDevMint.ts` under `typescript/src/oracle/`:
   - Move call: `${ENV.PACKAGE_ID}::verilens_oracle::enable_dev_mint`.
   - Parse `objectChanges` for `${ENV.PACKAGE_ID}::verilens_oracle::DevMintCap` (type `created` transferred to sender), extract `objectId`.
   - Persist to `.env` and `frontend/.env.local` as `DEV_MINT_CAP_ID` and `NEXT_PUBLIC_DEV_MINT_CAP_ID` respectively.
   - Return `{ digest, devMintCapId }`.
2. Add Jest tests `dev-mint.test.ts` with parsing fixture and optional integration test.

## Helpers Refactor
1. Create `typescript/src/helpers/parseObjectChanges.ts`:
   - `extractCreatedId(objectChanges, typeName): string | undefined`
   - `extractCreatedIds(objectChanges, typeName): string[]`
   - Reuse in `createConfig.ts`, `enableDevMint.ts`; migrate from `parseCreatedObjectIds.ts`.
2. Add `typescript/src/helpers/validation.ts`:
   - `validateExpectedCodeHash(hex)`, `validateCompressedSecp256k1Pubkey(hex)` using `zod`.
3. Add `typescript/src/helpers/envStore.ts`:
   - Utilities to append/update key-value in `.env` and `frontend/.env.local` safely, idempotent, without overwriting unrelated keys.
4. Remove or relocate non-VeriLens demo helpers (`hero` flow) into a `legacy/` folder or delete per requirement.

## Testing Implementation
- Use Jest with `ts-jest` (already configured):
  - Unit tests for validators and parsing helpers.
  - Flow tests for package publishing, config creation, dev mint.
  - Integration tests guarded by env presence (`SUI_NETWORK`, funded `USER_SECRET_KEY`) and `it.skip` when missing.
- Example fixtures: save trimmed `SuiTransactionBlockResponse` JSON samples to assert object ID extraction.

## Backend Preparation
- Output a JSON summary (stdout) after each operation with `{ packageId, oracleConfigId, devMintCapId }`.
- Prepare an interface for TEE job verification payload types in `typescript/src/types/verification.ts`:
  - Types for blob IDs, hashes, code hash, prover ID, signature, owner.
- Define the submit-attestation caller (future work): references `Clock` (`0x6`) and uses `submit_attestation` or `submit_mock_attestation` depending on environment.

## Quality Assurance
- Strict typing across modules; use SDK types like `SuiTransactionBlockResponse` and `SuiObjectChangeCreated`.
- Input validation with `zod` before building transactions; fail-fast with descriptive errors.
- Logging using structured logs for critical steps (publish, create config, enable dev mint) with digests and IDs.
- Add JSDoc comments for all helpers and public functions.

## Deliverables
- New TypeScript modules under `typescript/src/oracle/*` and `helpers/*`.
- Extended env handling and automatic persistence of IDs to scripts and frontend env.
- Jest test suite for validators, parsing, and flows.
- Documentation via JSDoc in code; IDs surfaced via logs and env files.

## Assumptions
- `sui move build` is run beforehand to produce publishable artifacts (`verilens/verilens_oracle/build`).
- A funded `USER_SECRET_KEY` is available for `testnet` or `localnet` per `ENV.SUI_NETWORK`.
- Frontend consumes `NEXT_PUBLIC_*` vars and will pick them up via Next.js reload.

## Confirmation
If this plan looks good, I’ll implement the modules, validators, parsing helpers, tests, and env persistence exactly as outlined, and run the integration tests to produce the required IDs.