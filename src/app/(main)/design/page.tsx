import { redirect } from 'next/navigation';

// /design heißt jetzt /news
export default function DesignMoved() {
  redirect('/news');
}
