import "dotenv/config";

const endpoint = process.env.NAUTILUS_ENDPOINT || "";
const mediaBlobId = process.env.MEDIA_BLOB_ID || "";
const manifestBlobId = process.env.MANIFEST_BLOB_ID || "";

async function main() {
  if (!endpoint) throw new Error("NAUTILUS_ENDPOINT must be set");
  if (!mediaBlobId || !manifestBlobId) throw new Error("MEDIA_BLOB_ID and MANIFEST_BLOB_ID must be set");
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mediaBlobId, manifestBlobId }),
  });
  const json = await res.json();
  console.log("status:", res.status);
  console.log(JSON.stringify(json, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

