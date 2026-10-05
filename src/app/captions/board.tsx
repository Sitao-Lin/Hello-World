'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { generateCaption, rateCaption } from './actions';
import styles from './captions.module.css';

export type Caption = { id: string; prompt: string; caption: string; vibe: string; created_at: string; score: number; votes: number; my_vote: number };

export default function Board({ captions, signedIn, failed }: { captions: Caption[]; signedIn: boolean; failed: boolean }) {
  const [prompt, setPrompt] = useState('');
  const [vibe, setVibe] = useState('dry');
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  function generate(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const result = await generateCaption(prompt, vibe);
        setMessage(result.error || result.success || '');
        if (result.success) setPrompt('');
      } catch { setMessage('Connection interrupted. Your draft is still here.'); }
    });
  }
  function vote(id: string, value: number) {
    startTransition(async () => {
      try { const result = await rateCaption(id, value); setMessage(result.error || result.success || ''); }
      catch { setMessage('Connection interrupted. Please try your vote again.'); }
    });
  }
  return <main className={styles.page}>
    <header><p className="eyebrow">CAMPUS CAPTIONS</p><h1>Today’s little NYC plot twist.</h1><p>AI writes the caption. You decide whether it lands.</p></header>
    <div className={styles.layout}>
      <section className={styles.composer} aria-labelledby="create-heading"><h2 id="create-heading">Give us the moment</h2><p>A missed 1 train, a dorm kitchen disaster, a bodega cat with tenure.</p>
        {signedIn ? <form onSubmit={generate}>
          <label htmlFor="moment">Your moment</label><textarea id="moment" value={prompt} onChange={e => setPrompt(e.target.value)} minLength={6} maxLength={240} required disabled={pending} placeholder="The 1 train doors close just as I reach the platform…" />
          <label htmlFor="tone">Delivery</label><select id="tone" value={vibe} onChange={e => setVibe(e.target.value)} disabled={pending}><option value="dry">Dry</option><option value="unhinged">Unhinged</option><option value="wholesome">Wholesome</option></select>
          <button disabled={pending || prompt.trim().length < 6}>{pending ? 'Working…' : 'Generate & publish'}</button><p className="hint">Your prompt and caption will be public. Five attempts per rolling 24 hours, including unsuccessful attempts.</p>
        </form> : <><p>Sign in with your existing account to create captions and vote.</p><Link className="button" href="/login">Sign in with Google</Link></>}
      </section>
      <section aria-labelledby="board-heading"><h2 id="board-heading">Fresh from the neighborhood</h2><p className={styles.message} role="status" aria-live="polite">{message}</p>
        {failed ? <p role="alert">The caption board is unavailable. Please refresh in a moment.</p> : captions.length === 0 ? <p>No captions yet. Add a moment to start the conversation.</p> : captions.map(item => <article className={styles.card} key={item.id}>
          <div className={styles.meta}><span>AI generated · {item.vibe}</span><time dateTime={item.created_at}>{item.created_at.slice(0, 10)}</time></div>
          <blockquote>{item.caption}</blockquote><details><summary>See the original prompt</summary><p>{item.prompt}</p></details>
          <div className={styles.votes}><span>{item.score} points · {item.votes} votes</span>{signedIn ? <><button aria-label="Upvote caption" aria-pressed={item.my_vote === 1} disabled={pending} onClick={() => vote(item.id, 1)}>↑ Hits</button><button aria-label="Downvote caption" aria-pressed={item.my_vote === -1} disabled={pending} onClick={() => vote(item.id, -1)}>↓ Misses</button></> : <Link href="/login">Sign in to vote</Link>}</div>
        </article>)}
      </section>
    </div>
  </main>;
}
