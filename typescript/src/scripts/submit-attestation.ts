import { submitAttestation } from "../oracle/submitAttestation";
import { SuiClient } from "@mysten/sui/client";
import { ENV } from "../env";

const main = async () => {
  const args = Object.fromEntries(process.argv.slice(2).map((a) => a.split("=", 2)).filter(([k, v]) => k && v));

  let media = args["media"];
  let manifest = args["manifest"];
  const digest = args["digest"];

  if (digest && (!media || !manifest)) {
    const sui = new SuiClient({ url: ENV.SUI_NETWORK });
    const res: any = await sui.queryEvents({ query: { Transaction: digest } as any } as any);
    const ev: any = (res as any).data?.[0];
    media = media ?? ev?.parsedJson?.blob_id_content ?? ev?.data?.blob_id_content;
    manifest = manifest ?? ev?.parsedJson?.blob_id_manifest ?? ev?.data?.blob_id_manifest;
  }

  const required = ["prover", "contentHash", "manifestHash", "codeHash", "signature"];
  for (const k of required) if (!args[k]) throw new Error(`Missing required arg: ${k}`);
  if (!media || !manifest) throw new Error("Provide media=<blobId> and manifest=<blobId> or digest=<txDigest>");

  const owner = args["owner"];

  const res = await submitAttestation({
    oracleConfigId: ENV.ORACLE_CONFIG_ID!,
    mediaBlobId: media,
    manifestBlobId: manifest,
    proverTeeId: args["prover"],
    contentHashHex: args["contentHash"],
    manifestHashHex: args["manifestHash"],
    codeHashHex: args["codeHash"],
    verified: true,
    signatureHex: args["signature"],
    ownerAddress: owner,
  });

  const digestOut = (res as any)?.digest || (res as any)?.effects?.transactionDigest || (res as any)?.data?.digest;
  console.log("submit_attestation digest:", digestOut);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

