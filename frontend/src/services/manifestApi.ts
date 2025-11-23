const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

export interface GenerateManifestResponse {
  json?: Manifest;
  xml?: string;
}

export class ManifestApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ManifestApiError';
  }
}

export async function generateManifest(
  data: ManifestPayload,
  formats: ('json' | 'xml')[]
): Promise<GenerateManifestResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/manifest/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data, formats }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ManifestApiError(
        errorData.error || 'Failed to generate manifest',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ManifestApiError) {
      throw error;
    }
    throw new ManifestApiError(
      'Network error: Unable to connect to manifest service',
      undefined,
      error
    );
  }
}

// Download helper function
export function downloadManifest(content: string, filename: string, type: 'json' | 'xml') {
  const mimeType = type === 'json' ? 'application/json' : 'application/xml';
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}