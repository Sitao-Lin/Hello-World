import Image from 'next/image';
import { getProfile } from '@/lib/auth';
import ProfileForm from './profile-form';

export default async function Profile() {
  const { supabase, user, profile } = await getProfile();
  const incomplete = !profile.first_name?.trim() || !profile.last_name?.trim();
  let photoUrl: string | undefined;
  if (profile.avatar_path) {
    const { data } = await supabase.storage.from('avatars').createSignedUrl(profile.avatar_path, 600);
    photoUrl = data?.signedUrl;
  }
  return <main className="account-page"><p className="eyebrow">MAKE YOURSELF AT HOME</p><h1>Your profile.</h1><p>{incomplete ? 'Before you enter your reading room, tell us your first and last name.' : 'A familiar face. A name to go with it. Update your details anytime.'}</p><section className="panel"><div className="profile-summary">{photoUrl ? <Image className="avatar" src={photoUrl} alt="Your profile photo" width={88} height={88} unoptimized /> : <div className="avatar avatar-placeholder" aria-label="No profile photo">{profile.first_name?.slice(0,1) || 'R'}</div>}<div><h2>{profile.first_name || 'New reader'}</h2><p className="hint">{user.email}</p></div></div><ProfileForm firstName={profile.first_name} lastName={profile.last_name} /></section></main>;
}
