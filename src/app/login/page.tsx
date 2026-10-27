import { signIn } from '../auth/actions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/reading-room');
  const { error } = await searchParams;
  return <main className="account-page"><p className="eyebrow">YOUR NEXT CHAPTER</p><h1>A room of your own.</h1><p>Sign in to make yourself at home. Your profile and private reading space are waiting.</p>{error && <p className="message" role="alert">We couldn’t complete your sign-in. Please try again.</p>}<form action={signIn}><button>Continue with Google</button></form><p className="hint">New here? Your account is created when you sign in for the first time.</p></main>;
}
