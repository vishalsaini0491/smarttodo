import { getDB } from '../db/initDB';
import { findTopNSimilar } from './vectorSearch';
import { generateTaskEmbeddingBlob } from './embedding2';

// Azure OpenAI config
const AZURE_OPENAI_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT; // e.g. "https://<resource>.openai.azure.com"
const AZURE_OPENAI_KEY = import.meta.env.VITE_AZURE_OPENAI_KEY;
const AZURE_EMBEDDING_DEPLOYMENT = import.meta.env.VITE_AZURE_EMBEDDING_DEPLOYMENT; // e.g. "ada-002-embedding"
const AZURE_CHAT_DEPLOYMENT = import.meta.env.VITE_AZURE_CHAT_DEPLOYMENT; // e.g. "gpt-4o-mini"

const MAX_TASKS = 10;
const MAX_DESCRIPTION_LENGTH = 1000;

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.substring(0, MAX_DESCRIPTION_LENGTH).replace(/[<>]/g, '');
}

const sanitizeTaskFields = (task) => {
  if (!task || typeof task !== 'object') return null;
  return {
    id: task.id,
    title: sanitizeString(task.title) || 'Untitled Task',
    description: sanitizeString(task.description) || 'No description provided.',
    status: sanitizeString(task.status) || 'unknown',
    priority: sanitizeString(task.priority) || 'none',
    due_date: sanitizeString(task.due_date) || 'not set',
    created_at: sanitizeString(task.created_at) || 'unknown',
    completion_date: sanitizeString(task.completion_date) || null,
    type: sanitizeString(task.type) || 'unknown'
  };
};

// --- Main RAG logic ---

// 1. Generate embedding for the user query
// 2. Fetch all task embeddings from the DB
// 3. Compute cosine similarity in JS (findTopNSimilar)
// 4. Fetch top-matching tasks and build context
// 5. Call LLM with enriched prompt

export const generateRefinedResponse = async (userQuery) => {
  try {
    if (!userQuery || typeof userQuery !== 'string') {
      throw new Error('Invalid user query');
    }
    // Generate embedding for the query using the same logic as tasks
    const queryEmbeddingBlob = await generateTaskEmbeddingBlob(userQuery);
    if (!queryEmbeddingBlob) {
      throw new Error('Failed to generate embedding for user query.');
    }
    // Convert embedding to JS array for vector search
    const queryEmbedding = Array.from(new Float32Array(queryEmbeddingBlob.buffer || queryEmbeddingBlob));
    // Fetch all embeddings from the DB
    const db = await getDB();
    const result = await db.query(
      `SELECT id, type, embedding FROM task_embeddings`,
      []
    );
    if (!result || !Array.isArray(result.values) || result.values.length === 0) {
      return 'No relevant context found to answer your query.';
    }
    // Parse embeddings and run vector search
    const candidates = result.values.map(row => ({
      ...row,
      embedding: typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding
    }));
    const topMatches = findTopNSimilar(queryEmbedding, candidates, MAX_TASKS);
    // Fetch the corresponding tasks
    const taskIds = topMatches.filter(row => row.type === 'task').map(row => row.id);
    let tasks = [];
    if (taskIds.length) {
      const placeholders = taskIds.map(() => '?').join(',');
      if (placeholders) {
        const taskQuery = await db.query(
          `SELECT id, title, description, status, priority, due_date, created_at FROM tasks WHERE id IN (${placeholders})`,
          taskIds
        );
        tasks = Array.isArray(taskQuery.values) ? taskQuery.values.map(sanitizeTaskFields).filter(Boolean) : [];
      }
    }
    // Map back to the order of topMatches
    const taskMap = new Map(tasks.map(entry => [entry.id, entry]));
    const relevantEntries = topMatches
      .map(row => taskMap.get(row.id))
      .filter(Boolean)
      .slice(0, MAX_TASKS);
    if (!relevantEntries.length) {
      return 'No relevant context found to answer your query.';
    }
    // Build context for LLM
    const context = relevantEntries.map((entry, index) => {
      try {
        const numberedLabel = `(${index + 1})`;
        const typeLabel = `[${entry.type.toUpperCase()}]`;
        const sanitizedEntry = sanitizeTaskFields(entry);
        if (!sanitizedEntry) return '';
        const lines = [
          `${numberedLabel} ${typeLabel} Title: ${sanitizedEntry.title}`,
          `Description: ${sanitizedEntry.description}`,
          sanitizedEntry.status ? `Status: ${sanitizedEntry.status}` : '',
          `Priority: ${sanitizedEntry.priority}`,
          `Due Date: ${sanitizedEntry.due_date}`,
          `Created At: ${sanitizedEntry.created_at}`,
          sanitizedEntry.completion_date ? `Completion Date: ${sanitizedEntry.completion_date}` : ''
        ].filter(Boolean);
        return lines.join('\n');
      } catch (error) {
        console.error('Error formatting task entry:', error);
        return '';
      }
    }).filter(Boolean).join('\n\n');
    // Call LLM (Azure OpenAI) with enriched prompt
    const enrichedPrompt = `You are an intelligent assistant tasked with answering user queries based on on_going_task and past_completed_task information.\n\n    User Query: ${userQuery}\n\n    Relevant Context:\n    ${context}\n\n    Please generate a helpful, concise, and actionable response.`.trim();
    // --- LLM call ---
    // (You may want to move this to a separate utility if you have multiple LLM providers)
    const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_CHAT_DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': AZURE_OPENAI_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful, context-aware assistant.' },
          { role: 'user', content: enrichedPrompt }
        ],
        max_tokens: 500
      })
    });
    if (!response.ok) throw new Error('Azure chat API error');
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('Invalid response from Azure OpenAI');
    }
    return content;
  } catch (error) {
    console.error('Error generating refined response:', error);
    return 'An error occurred while processing your request.';
  }
};


