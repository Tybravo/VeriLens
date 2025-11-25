import * as crypto from "crypto";

export async function POST(request: Request) {
  const { data, formats } = await request.json();

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return new Response(JSON.stringify({ error: "Invalid or missing 'data' object" }), { status: 400 });
  }

  if (!Array.isArray(formats) || formats.length === 0) {
    return new Response(JSON.stringify({ error: "Missing 'formats' array" }), { status: 400 });
  }

  const jsonStr = JSON.stringify(data);
  const hash = crypto.createHash("sha256").update(jsonStr).digest("hex");

  const manifest = {
    version: "1.0.0",
    timestamp: Date.now(),
    hash,
    payload: data,
    generatedBy: "VeriLens Manifest Engine",
  };

  const response: Record<string, any> = {};
  if (formats.includes("json")) {
    response.json = manifest;
  }
  if (formats.includes("xml")) {
    const payloadEntries = Object.entries(data).map(([k, v]) => `<${k}>${String(v)}</${k}>`).join("");
    const xml = `<?xml version="1.0" encoding="UTF-8"?><manifest><version>1.0.0</version><timestamp>${manifest.timestamp}</timestamp><hash>${manifest.hash}</hash><payload>${payloadEntries}</payload><generatedBy>${manifest.generatedBy}</generatedBy></manifest>`;
    response.xml = xml;
  }

  return new Response(JSON.stringify(response), { status: 200, headers: { "Content-Type": "application/json" } });
}
