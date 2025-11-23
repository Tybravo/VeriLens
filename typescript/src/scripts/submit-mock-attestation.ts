import { submitMockAttestation } from "../oracle/submitMockAttestation";

const main = async () => {
  const args = process.argv.slice(2);
  const flags = Object.fromEntries(
    args
      .map((a) => a.split("=", 2))
      .filter(([k, v]) => k && v)
  );
  let media = flags["media"];
  let manifest = flags["manifest"];
  const digest = flags["digest"];

  if (digest && (!media || !manifest)) {
    const res = await (await import("@mysten/sui/client")).SuiClient.prototype.queryEvents.call(
      (await import("../suiClient")).suiClient,
      { query: { Transaction: digest } } as any
    );
    const ev: any = (res as any).data?.[0];
    media = media ?? ev?.parsedJson?.blob_id_content ?? ev?.data?.blob_id_content;
    manifest = manifest ?? ev?.parsedJson?.blob_id_manifest ?? ev?.data?.blob_id_manifest;
  }

  if (!media || !manifest) {
    throw new Error("Provide media=<blobId> and manifest=<blobId> or digest=<txDigest>");
  }

  const result = await submitMockAttestation({ mediaBlobId: media, manifestBlobId: manifest });
  const digestOut = (result as any)?.digest || (result as any)?.effects?.transactionDigest || (result as any)?.data?.digest;
  console.log("submit_mock_attestation digest:", digestOut);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

