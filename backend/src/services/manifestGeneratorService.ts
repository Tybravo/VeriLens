import * as crypto from "crypto";
import { Builder as XMLBuilder } from "xml2js";
import { Manifest, ManifestPayload } from "../types/manifest";

export class ManifestGeneratorService {
  static generateManifest(payload: ManifestPayload): Manifest {
    const jsonStr = JSON.stringify(payload);

    const hash = crypto
      .createHash("sha256")
      .update(jsonStr)
      .digest("hex");

    return {
      version: "1.0.0",
      timestamp: Date.now(),
      hash,
      payload,
      generatedBy: "VeriLens Manifest Engine"
    };
  }

  static toXML(manifest: Manifest): string {
    const builder = new XMLBuilder({
      headless: true,
      renderOpts: { pretty: true }
    });

    return builder.buildObject({ manifest });
  }
}
