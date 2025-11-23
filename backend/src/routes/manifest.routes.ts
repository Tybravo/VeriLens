import express from "express";
import { ManifestGeneratorService } from "../services/manifestGeneratorService";

const router = express.Router();

router.post("/generate", (req, res) => {
  try {
    const { data, formats } = req.body;

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return res.status(400).json({ error: "Invalid or missing 'data' object" });
    }

    if (!Array.isArray(formats) || formats.length === 0) {
      return res.status(400).json({ error: "Missing 'formats' array" });
    }

    const manifest = ManifestGeneratorService.generateManifest(data);

    const response: Record<string, any> = {};

    if (formats.includes("json")) {
      response.json = manifest;
    }

    if (formats.includes("xml")) {
      response.xml = ManifestGeneratorService.toXML(manifest);
    }

    return res.json(response);

  } catch (error) {
    console.error("Manifest generation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
