import React, { useState } from 'react';
import Layout from "../pages/Layout";
import "../styles/AIPageStyle.css";
import { fetchAllEmbeddings } from '../db/queries';
import { cosineSimilarity, findTopNSimilar } from '../utils/vectorSearch';
import { generateTaskEmbeddingBlob } from '../utils/embedding2';

const SparkleIcon = () => (
  <svg width="30" height="30" fill="none" style={{ marginBottom: -5 }}>
    <g>
      <path d="M15 2v5M15 23v5M5 15H0M30 15h-5M22.07 7.93l-3.54 3.54M11.47 18.53l-3.54 3.54M22.07 22.07l-3.54-3.54M11.47 11.47l-3.54-3.54"
        stroke="#FA812F" strokeWidth="2" strokeLinecap="round" />
      <circle cx="15" cy="15" r="6" fill="#FFB22C" />
    </g>
  </svg>
);

export default function AI() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [localResults, setLocalResults] = useState([]);

  const handleAsk = async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      const user_id = 1; // single user
      const ragResponse = await runTaskRagQuery(user_id, input);
      setResponse(ragResponse || "No response.");
    } catch {
      setResponse("Error getting response.");
    }
    setLoading(false);
  };

  // Local vector search demo
  const handleLocalVectorSearch = async () => {
    setLoading(true);
    setLocalResults([]);
    try {
      // Generate embedding for the query (same as in your backend)
      const embeddingBlob = await generateTaskEmbeddingBlob(input);
      // Convert to JS array (Float32Array)
      const queryEmbedding = Array.from(new Float32Array(embeddingBlob.buffer || embeddingBlob));
      // Fetch all embeddings from DB
      const candidates = await fetchAllEmbeddings('task');
      // Find top 5 similar
      const topMatches = findTopNSimilar(queryEmbedding, candidates, 5);
      setLocalResults(topMatches);
    } catch (err) {
      setLocalResults([{ id: 'err', score: 0, title: 'Error running local vector search' }]);
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="ai-outer" style={{
        width: '100vw',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        boxSizing: 'border-box',
        background: 'var(--color-bg)',
        padding: '0 clamp(3vw, 4vw, 24px)',
        position: 'relative',
      }}>
        <div className="ai-main-card" style={{
          background: 'var(--color-surface)',
          borderRadius: '1.3rem',
          boxShadow: 'var(--color-shadow)',
          padding: 'clamp(1em, 3vw, 1.5em) clamp(1em, 4vw, 1.5em)',
          width: 'min(90vw, 340px)',
          maxWidth: '90vw',
          minWidth: 'min(80vw, 220px)',
          margin: 'clamp(2vw, 3vw, 18px) auto 0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(0.7em, 1.5vw, 1em)',
          boxSizing: 'border-box',
          minHeight: 'unset',
          justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center', gap: '0.5em' }}>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.08rem, 2.5vw, 1.18rem)', color: 'var(--color-text)', margin: 0, textAlign: 'center', letterSpacing: 0.01, flex: 'none' }}>AI Assistant <span role="img" aria-label="Robot">🤖</span></h2>
            <span style={{ display: 'flex', alignItems: 'center' }}><SparkleIcon /></span>
          </div>
          <div style={{ fontSize: 'clamp(0.97rem, 2vw, 1.07rem)', color: 'var(--color-text-light)', fontWeight: 500, marginBottom: 0, textAlign: 'center', width: '100%' }}>
            Ask about your tasks or productivity.
          </div>
          {response && (
            <div className="ai-main-response animate-fadein" style={{ marginTop: 'clamp(0.7em, 1vw, 1em)', background: 'var(--color-bg)', color: 'var(--color-text)', borderRadius: '1.1rem', boxShadow: '0 2px 12px #1da1f222', width: '100%', border: '1.2px solid #1da1f2', fontSize: 'clamp(0.97rem, 2vw, 1.07rem)', fontWeight: 500, wordBreak: 'break-word', whiteSpace: 'pre-line', position: 'relative', padding: 'clamp(0.7em, 2vw, 1em)', textAlign: 'left' }}>
              <div style={{ marginBottom: 'clamp(0.3em, 1vw, 0.6em)', fontWeight: 700, color: '#1da1f2', fontSize: 'clamp(0.93rem, 2vw, 1.01rem)', display: 'flex', alignItems: 'center', gap: 'clamp(0.2em, 1vw, 0.5em)' }}>
                <span role="img" aria-label="bulb">💡</span> AI Response
              </div>
              <div>{response}</div>
            </div>
          )}
          {/* Local vector search demo button and results */}
          <button
            onClick={handleLocalVectorSearch}
            disabled={loading || !input.trim()}
            style={{ marginTop: 12, width: '100%', fontSize: 'clamp(0.95rem, 2vw, 1.05rem)', borderRadius: '0.7em', fontWeight: 700, background: '#eee', color: '#1da1f2', border: '1.2px solid #1da1f2', padding: '0.6em 0', cursor: loading ? 'not-allowed' : 'pointer', outline: 'none', boxShadow: '0 1.5px 8px #1da1f222' }}
            aria-label="Show similar tasks (local vector search)"
          >
            {loading ? 'Searching...' : 'Show Similar Tasks (Local Vector Search)'}
          </button>
          {localResults.length > 0 && (
            <div style={{ marginTop: 10, width: '100%', background: '#f8faff', borderRadius: '0.7em', border: '1px solid #e0e8f0', padding: '0.7em', fontSize: 'clamp(0.93rem, 2vw, 1.01rem)' }}>
              <div style={{ fontWeight: 700, color: '#1da1f2', marginBottom: 6 }}>Top 5 Similar Tasks (Local):</div>
              <ol style={{ margin: 0, paddingLeft: 18 }}>
                {localResults.map(r => (
                  <li key={r.id} style={{ marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>ID:</span> {r.id} <span style={{ fontWeight: 600 }}>Score:</span> {r.score.toFixed(4)}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
        <div style={{
          width: 'min(90vw, 340px)',
          maxWidth: '90vw',
          minWidth: 'min(80vw, 220px)',
          background: 'var(--color-surface)',
          boxShadow: '0 -2px 12px #1da1f222',
          padding: 'clamp(0.8em, 3vw, 1.2em) clamp(1em, 4vw, 1.3em)',
          margin: 'clamp(2vw, 3vw, 18px) auto clamp(7vw, 80px, 100px) auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.7em',
        }}>
          <label htmlFor="ai-task-input" style={{ fontWeight: 700, color: '#1da1f2', fontSize: 'clamp(0.97rem, 2vw, 1.07rem)', alignSelf: 'flex-start', marginBottom: '0.1em' }}>Your Query</label>
          <textarea
            id="ai-task-input"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="ai-main-textarea"
            disabled={loading}
            style={{ fontSize: 'clamp(0.98rem, 2vw, 1.09rem)', minHeight: 'clamp(2.2em, 7vw, 3.2em)', width: '100%', maxWidth: '100%', background: 'var(--color-bg)', border: '1.2px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '0.9em', boxShadow: '0 1.5px 8px #1da1f222', padding: 'clamp(0.7em, 2vw, 1em)', outline: 'none', transition: 'border-color 0.18s', resize: 'none', textAlign: 'left', marginBottom: '0.4em' }}
            onFocus={e => e.target.style.borderColor = '#1da1f2'}
            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            aria-label="Describe your task or question"
          />
          <button
            onClick={handleAsk}
            disabled={loading}
            className="ai-main-btn"
            style={{ width: '100%', fontSize: 'clamp(1rem, 2vw, 1.11rem)', borderRadius: '0.9em', fontWeight: 800, background: 'var(--color-accent)', color: '#fff', border: 'none', padding: 'clamp(0.7em, 2vw, 1em) 0', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.13s, color 0.13s', outline: 'none', boxShadow: '0 2px 8px #1da1f222' }}
            onMouseDown={e => e.currentTarget.style.background = '#1486c9'}
            onMouseUp={e => e.currentTarget.style.background = 'var(--color-accent)'}
            aria-label="Get AI Outline"
          >
            {loading ? 'Loading...' : 'Ask AI'}
          </button>
        </div>
      </div>
    </Layout>
  );
}