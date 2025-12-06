const RAW_API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').trim();
const API_BASE_URL = /^https?:\/\//.test(RAW_API_BASE_URL)
  ? RAW_API_BASE_URL.replace(/\/+$/, '')
  : '';

export interface ManifestPayload {
  [key: string]: string | number | boolean | null;
}

export interface GenerateManifestResponse {
  json?: Record<string, string | number | boolean | null>;
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
    const primaryUrl = `${API_BASE_URL}/api/manifest/generate`;
    const response = await fetch(API_BASE_URL ? primaryUrl : '/api/manifest/generate', {
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
    if (error instanceof ManifestApiError) throw error;
    if (API_BASE_URL) {
      try {
        const fallbackRes = await fetch('/api/manifest/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data, formats }),
        });
        if (!fallbackRes.ok) {
          const errData = await fallbackRes.json().catch(() => ({}));
          throw new ManifestApiError(errData.error || 'Failed to generate manifest', fallbackRes.status, errData);
        }
        return await fallbackRes.json();
      } catch (fallbackError) {
        throw new ManifestApiError('Network error: Unable to connect to manifest service', undefined, fallbackError);
      }
    }
    throw new ManifestApiError('Network error: Unable to connect to manifest service', undefined, error);
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
