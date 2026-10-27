import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const supabase = await createClient();
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('first_name,last_name').eq('id', user.id).single();
        const destination = profile?.first_name?.trim() && profile?.last_name?.trim() ? '/reading-room' : '/profile';
        return NextResponse.redirect(new URL(destination, request.url));
      }
    }
  }
  return NextResponse.redirect(new URL('/login?error=callback', request.url));
}
