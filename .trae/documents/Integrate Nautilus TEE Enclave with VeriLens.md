## Enclave Setup

* Clone the Nautilus reproducible build template: `git clone https://github.com/MystenLabs/nautilus` (Source: <https://github.com/MystenLabs/nautilus>)

* Use Linux for building (WSL2 Ubuntu recommended on Windows) or an AWS EC2 instance with Nitro Enclaves enabled.

* From the template directory, run the provided setup and build scripts in order. Script names can differ by template version; the common flow is:

  * Install dependencies and configure enclave: `./configure_enclave.sh` (often equivalent to your `setup-enclave-environment.sh`) (Source: <https://github.com/MystenLabs/nautilus-twitter>)

  * Build the enclave binary: `./build_enclave.sh` or `./build.sh`

  * Generate artifacts (verifier binary + keys): `./generate_artifacts.sh`

* Notes:

  * Run these in a Linux shell; if using WSL2, keep sources under your Windows user folder and invoke from Ubuntu.

  * For production, build on AWS (Amazon Linux 2023) with Nitro Enclaves tooling enabled per Nautilus docs (Source: <https://docs.sui.io/concepts/cryptography/nautilus>).

## Artifact Collection

* Record the verifier binary path, typically in `build/bin/<binary>` produced by the template.

* Locate the compressed secp256k1 public key at `artifacts/enclave-key.pub` (33-byte compressed format).

* Compute SHA-256 of the verifier binary to obtain `expected_code_hash`:

  * WSL: `sha256sum build/bin/<binary> | awk '{print $1}'`

  * PowerShell: `Get-FileHash build\bin\<binary> -Algorithm SHA256 | Select-Object -ExpandProperty Hash`

## Configuration (VeriLens)

* Use the existing config script; it expects positional args, not flags:

  * `ts-node typescript/src/scripts/create-config.ts <EXPECTED_CODE_HASH> <TRUSTED_PUBKEY>`

  * Outputs `ORACLE_CONFIG_ID` to set in `.env`.

* Update `.env` (validated in `typescript/src/env.ts:6–13`) with:

  * `SUI_NETWORK`

  * `PACKAGE_ID` (from your Move package deployment)

  * `USER_SECRET_KEY`

  * `ORACLE_CONFIG_ID`

* Code references:

  * CLI parsing and output: `typescript/src/scripts/create-config.ts:4–9`

  * Move call to create config: `typescript/src/oracle/createConfig.ts:29–47`

## Integration

* Replace the placeholder enclave bridge with real Nautilus outputs:

  * Current stub reads `EXPECTED_CODE_HASH`, `TEE_SIGNATURE_HEX`, and `PROVER_TEE_ID` from env and returns a fixed-success result: `typescript/src/services/enclaveBridge.ts:20–44`.

  * Implement a client that sends the `VerificationRequestEvent` payload (blob IDs) to your Nautilus enclave, computes content/manifest hashes inside the enclave, signs the attestation message, and returns `{ contentHashHex, manifestHashHex, codeHashHex, signatureHex, proverTeeId }`.

  * Match on-chain message format built in `verilens/verilens_oracle/sources/verilens_oracle.move:193–213`; signature verified in `submit_attestation` (`lines 118–139`).

* Worker flow wiring is already in place:

  * Polls events and calls `runVerifier`: `typescript/src/workers/verificationWorker.ts:27–53`

  * Submits attestation on-chain: `typescript/src/oracle/submitAttestation.ts:42–57`.

## Deployment Verification

* Dev path (optional): enable dev mint and test mock flow:

  * Enable cap: `ts-node typescript/src/scripts/enable-dev-mint.ts` (calls `verilens_oracle::enable_dev_mint` per `typescript/src/oracle/enableDevMint.ts:11–21`).

  * Submit mock attestation: `ts-node typescript/src/scripts/submit-mock-attestation.ts media=<blobId> manifest=<blobId>` (script: `typescript/src/scripts/submit-mock-attestation.ts:24–31`).

* Full path:

  * Start the worker: `ts-node typescript/src/scripts/run-worker.ts` (polls `VerificationRequestEvent`).

  * Or submit manually: `ts-node typescript/src/scripts/submit-attestation.ts media=<blobId> manifest=<blobId> prover=<teeId> contentHash=<hex> manifestHash=<hex> codeHash=<hex> signature=<hex>`

