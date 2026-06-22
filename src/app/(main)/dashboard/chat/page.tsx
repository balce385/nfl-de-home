import { redirect } from 'next/navigation';

// Channels leben im Community-Bereich
export default function ChatRedirect() {
  redirect('/community');
}
