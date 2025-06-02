// Cosine similarity between two arrays
export function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Find top-N most similar embeddings
export function findTopNSimilar(queryEmbedding, candidates, topN = 20) {
  const scored = candidates.map(row => {
    const emb = typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding;
    return {
      ...row,
      score: cosineSimilarity(queryEmbedding, emb)
    };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}
