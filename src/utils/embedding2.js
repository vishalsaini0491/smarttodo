// Azure OpenAI embedding generator for text-embedding-ada-002

const AZURE_OPENAI_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = import.meta.env.VITE_AZURE_OPENAI_KEY;
const AZURE_EMBEDDING_DEPLOYMENT = import.meta.env.VITE_AZURE_EMBEDDING_DEPLOYMENT;

/**
 * Generates an embedding from Azure OpenAI and returns it as a Uint8Array for BLOB storage
 */
export const generateTaskEmbeddingBlob = async (text) => {
  try {
    if (typeof text !== 'string') {
      return null;
    }
    const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_EMBEDDING_DEPLOYMENT}/embeddings?api-version=2024-02-15-preview`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': AZURE_OPENAI_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        model: "text-embedding-ada-002"
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure embedding API error:', response.status, errorText);
      return null;
    }
    const data = await response.json();
    const embeddingArr = data.data?.[0]?.embedding;
    if (!Array.isArray(embeddingArr)) return null;
    // Check for nested arrays or non-number elements
    if (!embeddingArr.every(x => typeof x === 'number' || (typeof x === 'object' && x === null))) {
      return null;
    }
    if (embeddingArr.some(x => Array.isArray(x))) {
      return null;
    }
    // Additional check for Infinity, -Infinity, or NaN
    if (embeddingArr.some(x => typeof x === 'number' && (!Number.isFinite(x) || Number.isNaN(x)))) {
      return null;
    }
    const floatArray = new Float32Array(embeddingArr);
    const uint8Array = new Uint8Array(floatArray.buffer); // Convert for BLOB
    return uint8Array;
  } catch (err) {
    console.error('Azure embedding exception:', err);
    return null;
  }
};

/*
This function generates an embedding for a given text using Azure OpenAI's text-embedding-ada-002 deployment.

Benefits of BLOB Storage:
-------------------------
Maintains the exact floating-point precision of the embedding.
Faster to load directly into memory for vector similarity searches in RAG applications.
Binary representation is more efficient for storage than using a TEXT column or JSON arrays.
*/
