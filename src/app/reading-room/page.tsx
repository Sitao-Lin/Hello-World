import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/auth';

export default async function ReadingRoom() {
  const { profile } = await getProfile();
  if (!profile.first_name?.trim() || !profile.last_name?.trim()) redirect('/profile');
  return <main className="account-page"><p className="eyebrow">MEMBERS’ READING ROOM</p><h1>Welcome, {profile.first_name}.</h1><p>A quiet corner to slow down and get lost in a good story.</p><section className="panel"><h2>A little reading ritual</h2><ol><li>Choose a book that sparks your curiosity.</li><li>Set aside twenty uninterrupted minutes.</li><li>Keep one sentence that stays with you.</li></ol><Link className="button" href="/">Explore the collection</Link></section><p className="hint">This space is available only when you’re signed in.</p></main>;
}
