
#[allow(implicit_const_copy, duplicate_alias)]

 module verilens::verilens_oracle {
    use std::vector; 
    use std::string; 
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer; 
    use sui::display; 
    use sui::package::{Self, Publisher};  // Add Publisher import
    use sui::event;
    use sui::hash;
    use sui::bcs;
    use sui::ecdsa_k1;
    use sui::clock::{Self, Clock};

    // ──────────────────────────────────────────────────────────────
    // One-Time-Witness for Publisher
    // ──────────────────────────────────────────────────────────────
    /// One-Time-Witness struct - must match module name in ALL CAPS
    public struct VERILENS_ORACLE has drop {}

    // ──────────────────────────────────────────────────────────────
    // Module Initializer
    // ──────────────────────────────────────────────────────────────
    /// Called automatically on publish - creates Publisher object
    fun init(otw: VERILENS_ORACLE, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);
        transfer::public_transfer(publisher, tx_context::sender(ctx));
    }

    // ... rest of your code ...
    

    // ──────────────────────────────────────────────────────────────
    // Errors
    // ──────────────────────────────────────────────────────────────
    const E_INVALID_CODE_HASH: u64 = 1;
    const E_INVALID_SIGNATURE: u64 = 2;

    // ──────────────────────────────────────────────────────────────
    // Trusted constants — REPLACE THESE WITH REAL VALUES IN PRODUCTION
    // ──────────────────────────────────────────────────────────────
    // SHA-256 hash of the exact C2PA verification binary run inside Nautilus TEE
    #[allow(unused_const)]
    const EXPECTED_CODE_HASH: vector<u8> = x"30c072e31f24a5798d988c15588d0fd1f506653ca1656dda5f9ceedb78f8cde6";

    // Compressed secp256k1 public key (33 bytes) of the Nautilus TEE instance
    #[allow(unused_const)]
    const TRUSTED_TEE_PUBKEY: vector<u8> = x"02b758ca11a68c04f2ebcb4b3bee0b5a1dd196e36cdc43817395ad2e51bbfe8b32";

    public struct OracleConfig has key {
        id: UID,
        expected_code_hash: vector<u8>,
        trusted_pubkey: vector<u8>,
    }

    public struct DevMintCap has key {
        id: UID,
    }

    // ──────────────────────────────────────────────────────────────
    // Events & Objects
    // ──────────────────────────────────────────────────────────────
    
    public struct VerificationRequestEvent has copy, drop {
        blob_id_content: vector<u8>,
        blob_id_manifest: vector<u8>,
        requester: address,
    }

    // Minted on successful verification — proves provenance on-chain
    
     public struct ProvenanceCertificate has key { 
         id: UID, 
         media_blob_id: vector<u8>, 
         manifest_blob_id: vector<u8>, 
         prover_ttee_id: vector<u8>, 
         attestation_hash: vector<u8>, 
         timestamp_ms: u64, 
         owner: address, 
         attestor: address, 
     } 

     // Visual badge NFT minted in Stage 5
     public struct ProvenanceBadge has key, store {
         id: UID,
         name: string::String,
         image_url: string::String,
         metadata_json: string::String,
     }

     public struct ProvenanceCertificateNFT has key, store {
         id: UID,
         name: string::String,
         image_url: string::String,
         metadata_json: string::String,
     }

    // ──────────────────────────────────────────────────────────────
    // Public entry functions
    // ──────────────────────────────────────────────────────────────

    public entry fun request_verification(
        blob_id_content: vector<u8>,
        blob_id_manifest: vector<u8>,
        ctx: &mut TxContext
    ) {
        event::emit(VerificationRequestEvent {
            blob_id_content,
            blob_id_manifest,
            requester: tx_context::sender(ctx),
        });
    }

    public entry fun create_config(
        expected_code_hash: vector<u8>,
        trusted_pubkey: vector<u8>,
        ctx: &mut TxContext
    ) {
        let cfg = OracleConfig { id: object::new(ctx), expected_code_hash, trusted_pubkey };
        transfer::share_object(cfg);
    }

    public entry fun update_config(
        config: &mut OracleConfig,
        expected_code_hash: vector<u8>,
        trusted_pubkey: vector<u8>
    ) {
        config.expected_code_hash = expected_code_hash;
        config.trusted_pubkey = trusted_pubkey;
    }

    public entry fun enable_dev_mint(ctx: &mut TxContext) {
        let cap = DevMintCap { id: object::new(ctx) };
        transfer::transfer(cap, tx_context::sender(ctx));
    }

    public entry fun submit_attestation(
        config: &OracleConfig,
        media_blob_id: vector<u8>,
        manifest_blob_id: vector<u8>,
        prover_ttee_id: vector<u8>,
        content_hash: vector<u8>,
        manifest_hash: vector<u8>,
        code_hash: vector<u8>,
        verified: bool,
        signature: vector<u8>,
        clock: &Clock,
        owner: address,
        ctx: &mut TxContext
    ) {
        assert!(code_hash == config.expected_code_hash, E_INVALID_CODE_HASH);

        let message = build_attestation_message(
            &media_blob_id,
            &manifest_blob_id,
            &prover_ttee_id,
            &content_hash,
            &manifest_hash,
            &code_hash,
            verified
        );

        let msg_hash = hash::keccak256(&message);

        let valid = ecdsa_k1::secp256k1_verify(
            &signature,
            &config.trusted_pubkey,
            &msg_hash,
            0
        );
        assert!(valid, E_INVALID_SIGNATURE);

        let certificate = ProvenanceCertificate {
            id: object::new(ctx),
            media_blob_id,
            manifest_blob_id,
            prover_ttee_id,
            attestation_hash: msg_hash,
            timestamp_ms: clock::timestamp_ms(clock),
            owner,
            attestor: tx_context::sender(ctx),
        };

        transfer::transfer(certificate, owner);
    }

     public entry fun submit_mock_attestation( 
        _cap: &DevMintCap,
        config: &OracleConfig,
        media_blob_id: vector<u8>,
        manifest_blob_id: vector<u8>,
        prover_ttee_id: vector<u8>,
        content_hash: vector<u8>,
        manifest_hash: vector<u8>,
        verified: bool,
        clock: &Clock,
        owner: address,
        ctx: &mut TxContext
    ) {
        let message = build_attestation_message(
            &media_blob_id,
            &manifest_blob_id,
            &prover_ttee_id,
            &content_hash,
            &manifest_hash,
            &config.expected_code_hash,
            verified
        );
        let msg_hash = hash::keccak256(&message);
        let certificate = ProvenanceCertificate {
            id: object::new(ctx),
            media_blob_id,
            manifest_blob_id,
            prover_ttee_id,
            attestation_hash: msg_hash,
            timestamp_ms: clock::timestamp_ms(clock),
            owner,
            attestor: tx_context::sender(ctx),
        };
        transfer::transfer(certificate, owner);
     } 

     // ────────────────────────────────────────────────────────────── 
     // Internal helpers 
     // ────────────────────────────────────────────────────────────── 
    fun build_attestation_message(
        blob_content: &vector<u8>,
        blob_manifest: &vector<u8>,
        prover_ttee_id: &vector<u8>,
        hash_content: &vector<u8>,
        hash_manifest: &vector<u8>,
        code_hash: &vector<u8>,
        verified: bool
    ): vector<u8> {
        let mut msg = vector::empty<u8>();

        append_with_len(&mut msg, blob_content);
        append_with_len(&mut msg, blob_manifest);
        append_with_len(&mut msg, prover_ttee_id);
        append_with_len(&mut msg, hash_content);
        append_with_len(&mut msg, hash_manifest);
        append_with_len(&mut msg, code_hash);
        vector::push_back(&mut msg, if (verified) 1u8 else 0u8);

        msg
    }

    fun append_with_len(dest: &mut vector<u8>, data: &vector<u8>) {
        let len = vector::length(data);
        // Use BCS u64 length prefix
        vector::append(dest, bcs::to_bytes(&(len as u64)));
        vector::append(dest, *data);
    }

    #[test_only]
    public fun get_expected_code_hash_for_test(): vector<u8> {
        EXPECTED_CODE_HASH
    }

    #[test_only]
    public fun publish_test_config(ctx: &mut TxContext): OracleConfig {
        OracleConfig { id: object::new(ctx), expected_code_hash: EXPECTED_CODE_HASH, trusted_pubkey: TRUSTED_TEE_PUBKEY }
    }

     #[test_only] 
     public fun destroy_test_config(config: OracleConfig) { 
         let OracleConfig { id, expected_code_hash: _, trusted_pubkey: _ } = config; 
         id.delete(); 
     } 

     #[test_only] 
     public entry fun mint_test_certificate( 
        config: &OracleConfig,
        media_blob_id: vector<u8>,
        manifest_blob_id: vector<u8>,
        prover_ttee_id: vector<u8>,
        content_hash: vector<u8>,
        manifest_hash: vector<u8>,
        verified: bool,
        clock: &Clock,
        owner: address,
        ctx: &mut TxContext
    ) {
        let message = build_attestation_message(
            &media_blob_id,
            &manifest_blob_id,
            &prover_ttee_id,
            &content_hash,
            &manifest_hash,
            &config.expected_code_hash,
            verified
        );
        let msg_hash = hash::keccak256(&message);
        let certificate = ProvenanceCertificate {
            id: object::new(ctx),
            media_blob_id,
            manifest_blob_id,
            prover_ttee_id,
            attestation_hash: msg_hash,
            timestamp_ms: clock::timestamp_ms(clock),
            owner,
            attestor: tx_context::sender(ctx),
        };
         transfer::transfer(certificate, owner); 
     } 

     // ──────────────────────────────────────────────────────────────
     // Badge Minting (Stage 5)
     // ──────────────────────────────────────────────────────────────
     public entry fun mint_provenance_nft(
         recipient: address,
         name: string::String,
         image_url: string::String,
         metadata_json: string::String,
         ctx: &mut TxContext,
     ) {
         let badge = ProvenanceBadge {
             id: object::new(ctx),
             name,
             image_url,
             metadata_json,
         };
         transfer::transfer(badge, recipient);
     }

     public entry fun mint_certificate_nft(
         recipient: address,
         name: string::String,
         image_url: string::String,
         metadata_json: string::String,
         ctx: &mut TxContext,
     ) {
         let cert = ProvenanceCertificateNFT {
             id: object::new(ctx),
             name,
             image_url,
             metadata_json,
         };
         transfer::transfer(cert, recipient);
     }

     // Initialize wallet display metadata so badges render in wallets.
  
    #[allow(lint(share_owned))]
    public entry fun init_badge_display(pub: &Publisher, ctx: &mut TxContext) {
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"image_url"),
            string::utf8(b"description")
        ];
        let values = vector[
            string::utf8(b"{name}"),
            string::utf8(b"{image_url}"),
            string::utf8(b"{metadata_json}")
        ];
        let mut d = display::new_with_fields<ProvenanceBadge>(pub, keys, values, ctx);
        display::update_version(&mut d);
        transfer::public_share_object(d);  // Changed from transfer::share_object
    }

    #[allow(lint(share_owned))]
    public entry fun init_certificate_display(pub: &Publisher, ctx: &mut TxContext) {
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"image_url"),
            string::utf8(b"description")
        ];
        let values = vector[
            string::utf8(b"{name}"),
            string::utf8(b"{image_url}"),
            string::utf8(b"{metadata_json}")
        ];
        let mut d = display::new_with_fields<ProvenanceCertificateNFT>(pub, keys, values, ctx);
        display::update_version(&mut d);
        transfer::public_share_object(d);  // Changed from transfer::share_object
    }
} 
