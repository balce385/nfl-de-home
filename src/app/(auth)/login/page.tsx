import { redirect } from 'next/navigation';

// Login wurde entfernt — die App ist komplett offen.
export default function LoginRemoved() {
  redirect('/');
}
