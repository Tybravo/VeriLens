export async function POST(request: Request) {
  const { data, formats } = await request.json();

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return new Response(JSON.stringify({ error: "Invalid or missing 'data' object" }), { status: 400 });
  }

  if (!Array.isArray(formats) || formats.length === 0) {
    return new Response(JSON.stringify({ error: "Missing 'formats' array" }), { status: 400 });
  }

  const normalized: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(data)) {
    const key = k.replace(/\s+/g, "_").trim();
    normalized[key] = v as any;
  }

  const useCaseName = (normalized["use_case_name"] ?? "Authentic AI-Generated Media Verification") as string;
  const flat = {
    ...normalized,
    generatedBy: "VeriLens Manifest Generator",
    use_case_name: useCaseName,
    timestamp: new Date().toISOString(),
  };

  const response: Record<string, any> = {};
  if (formats.includes("json")) {
    response.json = flat;
  }
  if (formats.includes("xml")) {
    const entries = Object.entries(flat)
      .map(([k, v]) => `<${k}>${String(v)}</${k}>`)
      .join("");
    const xml = `<?xml version="1.0" encoding="UTF-8"?><manifest>${entries}</manifest>`;
    response.xml = xml;
  }

  return new Response(JSON.stringify(response), { status: 200, headers: { "Content-Type": "application/json" } });
}
