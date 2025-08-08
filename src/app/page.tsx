import { redirect } from 'next/navigation';

export default async function Home() {
  // For now, just redirect to install page
  // Session will be created during OAuth flow
  redirect('/install');
}

