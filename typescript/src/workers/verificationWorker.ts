import { SuiClient } from "@mysten/sui/client";
import { ENV } from "../env";
import { runVerifier } from "../services/enclaveBridge";
import { submitAttestation } from "../oracle/submitAttestation";

type VerificationEvent = {
  blob_id_content: string;
  blob_id_manifest: string;
  requester: string;
  id?: string;
};

const parseEvent = (ev: any): VerificationEvent | null => {
  const pj = ev?.parsedJson || ev?.data || {};
  const blob_id_content = pj?.blob_id_content || pj?.blob_content || pj?.blobIdContent;
  const blob_id_manifest = pj?.blob_id_manifest || pj?.blob_manifest || pj?.blobIdManifest;
  const requester = pj?.requester || ev?.sender;
  if (!blob_id_content || !blob_id_manifest || !requester) return null;
  return {
    blob_id_content,
    blob_id_manifest,
    requester,
    id: ev?.id,
  };
};

export const runVerificationWorker = async ({ intervalMs = 10000 }: { intervalMs?: number } = {}) => {
  if (!ENV.PACKAGE_ID) throw new Error("PACKAGE_ID is not set in env");
  const sui = new SuiClient({ url: ENV.SUI_NETWORK });
  const eventType = `${ENV.PACKAGE_ID}::verilens_oracle::VerificationRequestEvent`;
  let cursor: string | null = null;

  // Simple polling loop
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res: any = await sui.queryEvents({
        query: { MoveEventType: eventType } as any,
        cursor: cursor || undefined,
        limit: 50,
      } as any);

      const data: any[] = res?.data || [];
      for (const ev of data) {
        const parsed = parseEvent(ev);
        if (!parsed) continue;

        const verifierOut = await runVerifier({
          mediaBlobId: parsed.blob_id_content,
          manifestBlobId: parsed.blob_id_manifest,
        });

        await submitAttestation({
          oracleConfigId: ENV.ORACLE_CONFIG_ID!,
          mediaBlobId: parsed.blob_id_content,
          manifestBlobId: parsed.blob_id_manifest,
          proverTeeId: verifierOut.proverTeeId,
          contentHashHex: verifierOut.contentHashHex,
          manifestHashHex: verifierOut.manifestHashHex,
          codeHashHex: verifierOut.codeHashHex,
          verified: verifierOut.verified,
          signatureHex: verifierOut.signatureHex,
          ownerAddress: parsed.requester,
        });
      }

      const nextCursor = res?.nextCursor || null;
      cursor = nextCursor;
    } catch (e) {
      // swallow and continue polling
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }
};

