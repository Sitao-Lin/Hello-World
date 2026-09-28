'use server';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';

export type ProfileState = { error?: string; success?: string };
export async function saveProfile(_previous: ProfileState, form: FormData): Promise<ProfileState> {
  const { supabase, user } = await requireUser();
  const first = String(form.get('first_name') || '').trim();
  const last = String(form.get('last_name') || '').trim();
  if (!first || !last || first.length > 80 || last.length > 80) return { error: 'Enter both names, with at most 80 characters each.' };
  const { data: current, error: loadError } = await supabase.from('profiles').select('avatar_path').eq('id', user.id).single();
  if (loadError) return { error: 'Your profile could not be loaded. Please try again.' };
  const photo = form.get('photo');
  let path: string | undefined;
  if (photo instanceof File && photo.size > 0) {
    const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const extension = extensions[photo.type];
    if (!extension || photo.size > 2 * 1024 * 1024) return { error: 'Choose a JPG, PNG, or WebP image no larger than 2 MB.' };
    const bytes = new Uint8Array(await photo.arrayBuffer());
    const valid = photo.type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : photo.type === 'image/png' ? [137,80,78,71,13,10,26,10].every((b,i) => bytes[i] === b)
      : new TextDecoder().decode(bytes.slice(0,4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8,12)) === 'WEBP';
    if (!valid) return { error: 'That file does not appear to be a valid image.' };
    path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from('avatars').upload(path, bytes, { contentType: photo.type });
    if (error) return { error: 'Photo upload failed. Please try again.' };
  }
  const { data: saved, error } = await supabase.from('profiles').update({ first_name: first, last_name: last, ...(path ? { avatar_path: path } : {}) }).eq('id', user.id).select('id').single();
  if (error || !saved) {
    if (path) await supabase.storage.from('avatars').remove([path]);
    return { error: 'Your profile could not be saved. Please try again.' };
  }
  if (path && current.avatar_path) await supabase.storage.from('avatars').remove([current.avatar_path]);
  revalidatePath('/profile');
  revalidatePath('/reading-room');
  return { success: 'Your profile is saved. Your reading room is ready.' };
}
