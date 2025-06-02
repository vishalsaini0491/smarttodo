import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as rag from '../rag';
import * as initDB from '../../db/initDB';
import { AzureOpenAI } from "openai";

// Mock fetch for embedding2.js
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const mockDb = { query: vi.fn() };

// Only mock getDB, not fetch or Azure API
vi.spyOn(initDB, 'getDB').mockResolvedValue(mockDb);

const envReady = !!import.meta.env.VITE_AZURE_OPENAI_ENDPOINT && !!import.meta.env.VITE_AZURE_OPENAI_KEY && !!import.meta.env.VITE_AZURE_EMBEDDING_DEPLOYMENT && !!import.meta.env.VITE_AZURE_CHAT_DEPLOYMENT;

describe('generateRefinedResponse (Azure, unit)', () => {
  beforeEach(() => {
    mockDb.query.mockReset();
    mockFetch.mockReset();
  });

  it('returns a string response on success', async () => {
    // Mock embedding
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ embedding: Array(1536).fill(0.5) }] })
      });
    // Mock DB
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'Test', description: 'Desc', status: 'pending', priority: 'high', due_date: '2024-01-01', created_at: '2024-01-01' }] });
    // Mock fetch for chat completion
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Mocked Azure OpenAI Response' } }]
      })
    });
    const result = await rag.generateRefinedResponse('test query');
    expect(typeof result).toBe('string');
    expect(result).toBe('Mocked Azure OpenAI Response');
  });

  it('returns error if embedding generation fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API error'));
    const result = await rag.generateRefinedResponse('test query');
    expect(result).toMatch(/error/i);
  });

  it('returns error if db query fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ embedding: Array(1536).fill(0.5) }] })
    });
    mockDb.query.mockRejectedValueOnce(new Error('DB error'));
    const result = await rag.generateRefinedResponse('test query');
    expect(result).toMatch(/error|no relevant context/i);
  });

  it('returns error if OpenAI API fails', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ embedding: Array(1536).fill(0.5) }] })
      })
      .mockResolvedValueOnce({
        ok: false,
        text: async () => 'API error'
      });
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'Test', description: 'Desc', status: 'pending', priority: 'high', due_date: '2024-01-01', created_at: '2024-01-01' }] });
    const result = await rag.generateRefinedResponse('test query');
    expect(result).toMatch(/error/i);
  });

  it('returns no context found if no relevant entries', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ embedding: Array(1536).fill(0.5) }] })
    });
    mockDb.query.mockResolvedValueOnce({ values: [] });
    const result = await rag.generateRefinedResponse('test query');
    expect(result).toMatch(/no relevant context/i);
  });

  it('returns error for invalid user query', async () => {
    const result = await rag.generateRefinedResponse(null);
    expect(result).toMatch(/error/i);
  });
});

describe('generateRefinedResponse (Azure, real API)', () => {
  beforeEach(() => {
    mockDb.query.mockReset();
    vi.resetModules();
  });

  (envReady ? it : it.skip)('should return a non-empty string from generateRefinedResponse', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'Azure Test Task', description: 'A test task for Azure RAG', status: 'pending', priority: 'high', due_date: '2024-01-01', created_at: '2024-01-01' }] });
    const result = await rag.generateRefinedResponse('What is my pending task?');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    console.log('Azure RAG response:', result);
  }, 20000);
}); 