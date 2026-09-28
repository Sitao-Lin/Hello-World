'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signIn() {
  const supabase = await createClient();
  const h = await headers();
  const host = h.get('host');
  const origin = process.env.APP_URL || `${process.env.NODE_ENV === 'development' ? 'http' : 'https'}://${host}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google', options: { redirectTo: new URL('/auth/callback', origin).toString() },
  });
  if (error || !data.url) redirect('/login?error=signin');
  redirect(data.url);
}
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error('Sign out failed. Please try again.');
  redirect('/');
}
