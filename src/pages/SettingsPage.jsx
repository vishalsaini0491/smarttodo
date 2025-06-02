import React, { useState, useEffect } from "react";
import Layout from "./Layout";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [quote, setQuote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("userName") || "";
    setName(stored);
    const storedQuote = localStorage.getItem("userQuote") || "Success is the sum of small efforts, repeated.";
    setQuote(storedQuote);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem("userName", name.trim());
    localStorage.setItem("userQuote", quote.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <Layout>
      <div style={{ maxWidth: 480, width: '100%', margin: '0 auto', padding: 'clamp(1.5em, 5vw, 2.5em) 1.2em', background: 'var(--color-bg)', borderRadius: 18, boxShadow: '0 2px 12px #1da1f233', marginTop: 'clamp(1.5em, 5vw, 2.5em)', boxSizing: 'border-box' }}>
        <h1 style={{ color: 'var(--color-accent)', fontWeight: 900, fontSize: 'clamp(1.2rem, 4vw, 1.7rem)', marginBottom: '1.2em' }}>Settings</h1>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2em', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          <label htmlFor="user-name" style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: 'clamp(1rem, 2vw, 1.1rem)' }}>Your Name</label>
          <input
            id="user-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name..."
            style={{ padding: 'clamp(0.8em, 2vw, 1.1em)', borderRadius: 12, border: '1.5px solid var(--color-accent-light)', fontSize: 'clamp(1rem, 2vw, 1.1rem)', background: 'var(--color-bg-alt)', color: 'var(--color-accent)', fontWeight: 700, outline: 'none', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowWrap: 'break-word' }}
            minLength={2}
            maxLength={32}
            required
            autoComplete="off"
            aria-label="Your name"
          />
          <label htmlFor="user-quote" style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: 'clamp(1rem, 2vw, 1.1rem)' }}>Motivational Quote</label>
          <input
            id="user-quote"
            type="text"
            value={quote}
            onChange={e => setQuote(e.target.value)}
            placeholder="Set your motivational quote..."
            style={{ padding: 'clamp(0.8em, 2vw, 1.1em)', borderRadius: 12, border: '1.5px solid var(--color-accent-light)', fontSize: 'clamp(1rem, 2vw, 1.1rem)', background: 'var(--color-bg-alt)', color: 'var(--color-accent)', fontWeight: 700, outline: 'none', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowWrap: 'break-word' }}
            minLength={4}
            maxLength={60}
            required
            autoComplete="off"
            aria-label="Motivational quote"
          />
          <button type="submit" style={{ width: '100%', padding: 'clamp(0.8em, 2vw, 1.1em)', borderRadius: 12, border: 'none', background: 'var(--color-accent)', color: '#fff', fontWeight: 800, fontSize: 'clamp(1rem, 2vw, 1.1rem)', boxShadow: '0 2px 10px #1da1f233', cursor: 'pointer', transition: 'background 0.14s, color 0.14s, transform 0.13s' }}>Save</button>
          {saved && <div style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center', marginTop: 8 }}>Saved!</div>}
        </form>
        <div style={{ color: '#888', fontSize: '1rem', marginTop: 32, textAlign: 'center' }}>More settings coming soon...</div>
      </div>
    </Layout>
  );
} 