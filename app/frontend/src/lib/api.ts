import { createClient } from '@metagptx/web-sdk';

// Create client instance
export const client = createClient();

// Bill API types
export interface FetchBillRequest {
  url: string;
}

export interface FetchBillResponse {
  html: string;
  success: boolean;
  error?: string;
}

export interface ParseBillRequest {
  html: string;
}

export interface BillSegment {
  type: 'new' | 'deleted' | 'unchanged';
  text: string;
}

export interface BillStats {
  new_count: number;
  new_words: number;
  deleted_count: number;
  deleted_words: number;
}

export interface ParseBillResponse {
  segments: BillSegment[];
  taggedText: string;
  stats: BillStats;
  success: boolean;
  error?: string;
}

export interface AnalyzeBillRequest {
  taggedText: string;
}

// Bill API functions
export const billApi = {
  async fetchBill(url: string): Promise<FetchBillResponse> {
    const response = await client.apiCall.invoke({
      url: '/api/v1/bills/fetch',
      method: 'POST',
      data: { url },
    });
    return response.data;
  },

  async parseBill(html: string): Promise<ParseBillResponse> {
    const response = await client.apiCall.invoke({
      url: '/api/v1/bills/parse',
      method: 'POST',
      data: { html },
    });
    return response.data;
  },

  async analyzeBill(
    taggedText: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const response = await fetch('/api/v1/bills/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taggedText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const chunk = line.slice(6);
            if (chunk) {
              onChunk(chunk);
            }
          }
        }
      }

      onComplete();
    } catch (error: any) {
      onError(error.message || 'Failed to analyze bill');
    }
  },
};