export interface ManifestPayload {
  [key: string]: string | number | boolean | null;
}

export interface Manifest {
  version: string;
  timestamp: number;
  hash: string;
  payload: ManifestPayload;
  generatedBy: string;
}
