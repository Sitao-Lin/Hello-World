import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Board, { type Caption } from './board';

export const metadata = { title: 'Campus Captions · The Reading Room' };

export default async function CaptionsPage() {
  await connection();
  let captions: Caption[] = [];
  let signedIn = false;
  let failed = false;
  try {
    const db = await createClient();
    const [{ data: { user } }, { data, error }] = await Promise.all([db.auth.getUser(), db.rpc('caption_feed')]);
    signedIn = !!user;
    failed = !!error;
    captions = data ?? [];
  } catch { failed = true; }
  return <Board captions={captions} signedIn={signedIn} failed={failed} />;
}
