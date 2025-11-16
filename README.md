VeriLens — The Truth Engine for the Sui Ecosystem

VeriLens a decentralized media verification and provenance platform that proves the authenticity and origin of digital content directly on-chain. 

VeriLens is a decentralized **media verification and provenance** platform that proves the authenticity and origin of digital content directly on‑chain. Built on **Sui**, VeriLens leverages **Walrus** for decentralized media storage, **Seal** for encryption & access control, and **Nautilus** for trusted off‑chain attestations inside TEEs. VeriLens lets creators publish provable media, and lets developers integrate Proof‑as‑a‑Service APIs into their dApps.

---

## 🔑 Quick summary
- **Project name:** VeriLens
- **Goal:** Provide verifiable, auditable provenance for digital media (images, video, manifests) and publish immutable certificates of authenticity on Sui.
- **Core stack:** Sui (Move) + Walrus (storage) + Seal (encryption) + Nautilus (TEE attestations) + Next.js + TypeScript + Tailwind + Sui SDK.

---

## Project structure (recommended)

```
VeriLens/
├── README.md
├── pnpm-workspace.yaml
├── package.json
├── .env.example
├── apps/
│   ├── web/                        # Next.js + Tailwind + TS + Sui SDK (frontend dApp)
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── creator/
│   │   │       └── upload-content/
│   │   │           └── page.tsx    # /app/creator/upload-content/page.tsx
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MediaPreview.tsx
│   │   └── styles/globals.css
│   
│   ├── backend/                    # Node.js + Express + TS (API + workers)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   │   ├── api.ts           # REST API for developer integration
│   │   │   │   └── verify.ts        # submit verification requests
│   │   │   ├── services/
│   │   │   │   ├── walrusService.ts
│   │   │   │   ├── sealService.ts
│   │   │   │   ├── nautilusWorker.ts # TEE job trigger/management
│   │   │   │   └── suiService.ts
│   │   │   └── workers/
│   │   │       └── nautilus-trigger.ts
│   │   └── .env
│   
├── packages/                       # shared libs, types, UI
│   ├── ui/
│   └── shared/
│       └── src/
│           ├── types/
│           └── utils/

└── move/                           # Sui Move packages
    ├── Move.toml
    ├── sources/
    │   ├── c2pa_oracle.move        # C2PAOracle contract
    │   └── provenance.move         # ProvenanceCertificate object
    └── tests/
```

---

## Features & product goals
- Upload and register media blobs (images/videos) and attach C2PA manifests.
- Store media + manifests on Walrus (programmatic, shardable storage) and reference them on‑chain as Move objects.
- Trigger Nautilus TEE jobs to run the C2PA verification algorithm off‑chain and produce signed attestations.
- Verify Nautilus attestations on‑chain and mint `ProvenanceCertificate` objects that link video blob ID, manifest blob ID, attestation proof, timestamp, and submitter.
- Optionally encrypt media with Seal so only authorised parties can decrypt raw media.
- Public API / SDK for dApps and developers to submit files, query verification status, and retrieve provenanced certificates.

---

## How VeriLens works — High level flow (Creators)
1. **Creator** captures media and prepares the C2PA manifest (metadata describing origin, tools, and signatures).
2. Creator uploads both files via the dApp form (`/app/creator/upload-content/page.tsx`).
3. **Frontend (dApp):**
   - Optionally encrypts content using Seal before upload. -> returns two Walrus blob IDs.
   - Uploads encrypted (or plain) blobs to Walrus decentralized storage via the SUI TypeScript SDK.
   - Receives Walrus blob IDs and shard references.
   - Publishes this metadata as Move objects on the SUI blockchain, linking on-chain authenticity with off-chain storage.
4. Creator (or any user) submits a **Verification Request** to the `C2PAOracle` Move contract with the two Walrus blob IDs.
5. The backend/worker triggers a **Nautilus TEE job** that:
   - Fetches the video and manifest from Walrus.
   - Runs the C2PA verification algorithm inside the TEE.
   - Produces a signed attestation containing code hash, input hashes, output hash, and TEE signature.
6. The `C2PAOracle` Move contract verifies the attestation (signature + expected code hash + hashes) and, if valid, mints a `ProvenanceCertificate` Sui object linking the blobs with the attestation result.
7. The certificate is discoverable on‑chain and can be attached to NFTs, displayed in the dApp, or queried by third‑party dApps via the VeriLens API.

---

## How VeriLens works — High level flow (Developers / Integrators)
1. Developer calls the VeriLens API to submit media & manifest or passes Walrus blob IDs directly.
2. VeriLens returns an asynchronous verification job id and (optionally) a webhook callback configuration.
3. After Nautilus completes the verification and the on‑chain certificate is minted, VeriLens notifies the integrator (webhook) and the certificate is queryable via API or directly on Sui.

---

# How VeriLens Works for All Use Cases
VeriLens provides a unified authenticity pipeline that works for all digital content types—images, videos, documents, AI‑generated media, logs, and Web3 assets. Every use case follows the same simple verification flow while allowing flexible metadata through a C2PA‑style manifest.

---

## 1. Manifest‑First Design (Flexible for All Use Cases)
Every verification begins with a **JSON manifest** containing:
- Core provenance fields (timestamps, content hashes)
- Optional creator or device information
- Use‑case‑specific metadata (AI model, document type, incident notes, etc.)

This manifest acts as the **single source of truth** for the content’s origin.

---

## 2. Media + Manifest Stored on Walrus
VeriLens uploads two items to Walrus decentralized storage:
- The media file  
- The metadata manifest  

Each upload receives a **blob ID**, used later during verification.

---

## 3. Trusted Verification in a TEE
Nautilus TEE verifies:
- File integrity  
- Manifest integrity  
- Consistency of metadata  
- No tampering in upload or processing  

The TEE outputs a **signed attestation** proving the verification is trustworthy.

---

## 4. On‑Chain Provenance Certificate (Sui)
After successful verification, VeriLens mints a **ProvenanceCertificate** containing:
- Walrus blob IDs  
- The TEE attestation  
- Verification result  
- Any custom manifest fields  

This becomes a **permanent on‑chain proof** that any app, marketplace, or platform can query.

---

## 5. One Architecture, Endless Use Cases
Because everything is driven by the flexible manifest:
- No backend changes are required per use case  
- Developers can pass custom metadata  
- Creators can upload any kind of digital content  
- Third‑party apps integrate easily via API or blob references  

VeriLens supports AI art provenance, fact‑checking, document integrity, NFT verification, audit logs, journalism proofs, compliance workflows, and more—all using the same pipeline.

---

## Summary
**Media + Manifest → Walrus → TEE Verification → On‑Chain Certificate**

One simple workflow. Many powerful real‑world applications.

---

## On‑chain & off‑chain responsibilities
- **On‑chain (Move contracts)**
  - Store Walrus blob metadata as Move objects.
  - Receive verification requests and record request state.
  - Verify TEE attestations by checking the provider signature and comparing the attested code hash to the stored expected code hash.
  - Mint `ProvenanceCertificate` objects on successful verification.

- **Off‑chain**
  - Upload media to Walrus (client or backend).
  - Manage Seal encryption keys & policies for access control.
  - Run Nautilus TEE jobs (self‑hosted Nitro Enclave or other supported TEE nodes) to perform heavy cryptographic verification.
  - Submit attestation + result to the on‑chain contract.

---

## Important docs & references
- Sui Nautilus docs: https://docs.sui.io/concepts/cryptography/nautilus
- Sui Move concepts: https://docs.sui.io/concepts/sui-move-concepts
- Walrus docs: https://docs.wal.app (Walrus storage and APIs)
- Move language book: https://move-book.com/
- C2PA (Content Provenance spec): https://c2pa.org/

---

## Developer quick start (local dev)
1. Clone & install
```
git clone <repo-url>
cd VeriLens
pnpm install
```

2. Run frontend (Next.js)
```
cd apps/web
pnpm dev
```

3. Run backend
```
cd apps/backend
pnpm dev
```

4. Environment variables (examples)

**apps/web/.env.local**
```
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_WALRUS_GATEWAY=https://gateway.walrus.network
NEXT_PUBLIC_VERILENS_API=https://localhost:4000/api
```

**apps/backend/.env**
```
SUI_FULLNODE_URL=https://fullnode.testnet.sui.io
WALRUS_API_KEY=your_walrus_api_key
SEAL_KEYSTORE_ENDPOINT=https://seal.example
NAUTILUS_ENDPOINT=https://nautilus-runner.example
WEBHOOK_SECRET=...
```

---

## Move contracts (what to build)
- `C2PAOracle` — accepts verification requests (video_blob_id, manifest_blob_id, requester), stores request state, and exposes a `submit_attestation(attestation)` entry that verifies TEE signatures and code hash before minting a `ProvenanceCertificate` object.
- `ProvenanceCertificate` — Sui object storing: video_blob_id, manifest_blob_id, prover_ttee_id, attestation_hash, timestamp, and optionally an owner/attestor field.

Notes:
- The expected code hash used to verify Nautilus attestations should be published at deployment time in the `C2PAOracle` contract (or in a trusted registry Move object). When you update the TEE code, publish a new approved code hash through a governance flow.

---

## Nautilus & Attestation details (developer hints)
- Build reproducible TEE images and compute their code hashes during release. The hash you publish on‑chain (in the `C2PAOracle`) is the expected code fingerprint the contract will compare against attestation reports.
- TEE attestation must include: provider signature, measured code hash, input blob hashes (Walrus IDs or content hashes), result hash, and timestamp.
- The contract should verify provider signatures against the provider's root key (or a registry of trusted providers) and compare measured code hash to the on‑chain approved hash.

---

## ToDo (step‑by‑step) — Roadmap & minimal MVP
### Phase 0 — Research & design
- [ ] Read Nautilus documentation and sample repo (reproducible build template).
- [ ] Select C2PA library (JS/Java) and draft the TEE verification logic.
- [ ] Design Move schema for `C2PAOracle` and `ProvenanceCertificate`.

### Phase 1 — MVP: Creator workflow
- [ ] Build `/app/creator/upload-content/page.tsx` UI using Next.js + Tailwind.
  - Form sections: (1) media file upload; (2) associated C2PA manifest upload.
  - Use `Header.tsx` and `Footer.tsx` in layout.
- [ ] Implement Walrus upload service in backend or use the SUI Client + SUI TypeScript SDK; return two Walrus blob IDs.
- [ ] Store blob metadata on Sui (Move object) via `suiService`.
- [ ] Implement backend endpoint to create verification request (call Move contract or push message to worker queue).
- [ ] Build Nautilus worker prototype that fetches blobs and runs C2PA verification in a TEE (local dev may simulate attestation initially).
- [ ] Implement `submit_attestation` on `C2PAOracle` Move contract and mint `ProvenanceCertificate`.
- [ ] Frontend: display verification request status and link to the on‑chain certificate.

### Phase 2 — Dev API & SDK
- [ ] Build REST API endpoints for developers to submit Walrus blob IDs and poll job status.
- [ ] Publish a lightweight JS/TS SDK for easier integration.
- [ ] Add webhook support for job completion.

### Phase 3 — Security, ops & UX
- [ ] Integrate Seal for optional encryption and access policy management.
- [ ] Harden Nautilus TEE workflows: key provisioning, reproducible builds, attestation verification.
- [ ] Monitoring: Job metrics, Walrus availability checks.
- [ ] UX polish, documentation site, and public demo.

---

## Implementation notes for `/app/creator/upload-content/page.tsx`
- Use Next.js `app` router and create a page at: `/app/creator/upload-content/page.tsx`.
- Page layout:
  - `Header` and `Footer` imported from `components/` and used inside `layout.tsx`.
  - Form with two file inputs: `mediaFile` and `c2paManifest`.
  - On submit: call backend endpoint `/api/verify/submit` with files (multipart/form-data).
  - Backend returns: `{ walrusMediaId, walrusManifestId, jobId }`.
  - Display status UI with jobId and on‑chain link to certificate (once minted).

---

## Example API endpoints (suggested)
- `POST /api/verify/submit` — uploads files to Walrus, creates Move object for blobs, returns job id.
- `GET /api/verify/status/:jobId` — returns status and (when available) on‑chain certificate id.
- `POST /api/verify/webhook` — webhook receiver for job callbacks.

---

## Governance & upgrades
- Store approved Nautilus code hashes in a Move registry object that is updatable via a multisig or governance flow.
- On code updates, publish a new approved code hash and record migration notes on‑chain so verifiers can reason about older certificates.

---

## Licensing & attribution
VeriLens is an open project. Add your preferred license (MIT/Apache‑2.0) and include attribution for any third‑party libs (C2PA libraries, Walrus SDKs, Nautilus templates).

---



