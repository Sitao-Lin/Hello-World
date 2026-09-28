import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}
export async function getProfile() {
  const { supabase, user } = await requireUser();
  const { data: profile, error } = await supabase.from('profiles').select('first_name,last_name,avatar_path').eq('id', user.id).single();
  if (error) throw new Error('Your profile could not be loaded. Please try again.');
  return { supabase, user, profile };
}
