'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { saveProfile } from './actions';

export default function ProfileForm({ firstName, lastName }: { firstName: string | null; lastName: string | null }) {
  const [state, action, pending] = useActionState(saveProfile, {});
  return <form action={action} className="profile-form"><label htmlFor="first_name">First name</label><input id="first_name" name="first_name" autoComplete="given-name" maxLength={80} defaultValue={firstName || ''} required /><label htmlFor="last_name">Last name</label><input id="last_name" name="last_name" autoComplete="family-name" maxLength={80} defaultValue={lastName || ''} required /><label htmlFor="photo">Profile photo <span className="hint">(optional)</span></label><input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-help" /><p id="photo-help" className="hint">JPG, PNG, or WebP · Up to 2 MB. Leave blank to keep your current photo.</p>{state.error && <p role="alert" className="message">{state.error}</p>}{state.success && <div role="status" className="message">{state.success} <Link href="/reading-room">Enter your reading room →</Link></div>}<button disabled={pending}>{pending ? 'Saving…' : 'Save profile'}</button></form>;
}
