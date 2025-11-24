import { NextResponse } from "next/server";

const getWalrusUrls = (network: string) => {
  const isMainnet = network === "mainnet";
  return {
    publisherUrl: isMainnet ? "https://publisher.walrus.space" : "https://publisher.walrus-testnet.walrus.space",
    aggregatorUrl: isMainnet ? "https://aggregator.walrus.space" : "https://aggregator.walrus-testnet.walrus.space",
  };
};

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const mediaFile = form.get("mediaFile") as File | null;
    const manifestFile = form.get("manifestFile") as File | null;
    const network = (form.get("network") as string) || "testnet";

    if (!mediaFile || !manifestFile) {
      return NextResponse.json({ message: "Missing files" }, { status: 400 });
    }

    const { publisherUrl } = getWalrusUrls(network);

    const upload = async (file: File, epochs = 5) => {
      const buf = await file.arrayBuffer();
      const res = await fetch(`${publisherUrl}/v1/blobs?epochs=${epochs}`, {
        method: "PUT",
        body: new Blob([buf]),
        headers: { "Content-Type": "application/octet-stream" },
      });
      if (!res.ok) throw new Error(`Walrus upload failed: ${res.status} ${res.statusText}`);
      return res.json();
    };

    const mediaResult = await upload(mediaFile);
    const manifestResult = await upload(manifestFile);

    const mediaBlobId = mediaResult.newlyCreated?.blobObject?.blobId || mediaResult.alreadyCertified?.blobId;
    const manifestBlobId = manifestResult.newlyCreated?.blobObject?.blobId || manifestResult.alreadyCertified?.blobId;

    if (!mediaBlobId || !manifestBlobId) {
      return NextResponse.json({ message: "Failed to retrieve Walrus blob IDs" }, { status: 500 });
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return NextResponse.json({ walrusMediaId: mediaBlobId, walrusManifestId: manifestBlobId, jobId });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Upload failed" }, { status: 500 });
  }
}

