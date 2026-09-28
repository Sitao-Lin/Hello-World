import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/auth/actions';

export default async function Navigation() {
  let loggedIn = false;
  try { const client = await createClient(); const { data: { user } } = await client.auth.getUser(); loggedIn = !!user; } catch { /* Public collection remains available during configuration. */ }
  return <nav className="navigation" aria-label="Main navigation"><Link href="/">The Reading Room</Link><div><Link href="/">Collection</Link>{loggedIn ? <><Link href="/reading-room">My reading room</Link><Link href="/profile">Profile</Link><form action={signOut}><button className="quiet">Sign out</button></form></> : <Link className="button" href="/login">Sign in</Link>}</div></nav>;
}
