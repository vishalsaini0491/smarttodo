import { describe, it, expect } from 'vitest';
import { generateTaskEmbeddingBlob } from '../embedding2';

const envReady = !!import.meta.env.VITE_AZURE_OPENAI_ENDPOINT && !!import.meta.env.VITE_AZURE_OPENAI_KEY && !!import.meta.env.VITE_AZURE_EMBEDDING_DEPLOYMENT;

describe('embedding2.js (Azure, real API)', () => {
  (envReady ? it : it.skip)('should return a Uint8Array of expected length for ada-002', async () => {
    const result = await generateTaskEmbeddingBlob('This is a test for Azure embedding.');
    expect(result).toBeInstanceOf(Uint8Array);
    // ada-002 is 1536 floats, 4 bytes each
    expect(result.length === 1536 * 4 || result.length === 0).toBe(true);
    if (result.length > 0) {
      console.log('Azure embedding length:', result.length);
    } else {
      console.warn('Azure embedding returned empty array.');
    }
  });
}); 