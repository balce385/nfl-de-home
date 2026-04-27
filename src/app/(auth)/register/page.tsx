import { createClient } from '@/lib/supabase/server';
import { RegisterForm } from './RegisterForm';

// Fallback alle 32 Teams falls DB leer/keys fehlen
const FALLBACK_TEAMS = [
  { id: 'ARI', name: 'Arizona Cardinals' },
  { id: 'ATL', name: 'Atlanta Falcons' },
  { id: 'BAL', name: 'Baltimore Ravens' },
  { id: 'BUF', name: 'Buffalo Bills' },
  { id: 'CAR', name: 'Carolina Panthers' },
  { id: 'CHI', name: 'Chicago Bears' },
  { id: 'CIN', name: 'Cincinnati Bengals' },
  { id: 'CLE', name: 'Cleveland Browns' },
  { id: 'DAL', name: 'Dallas Cowboys' },
  { id: 'DEN', name: 'Denver Broncos' },
  { id: 'DET', name: 'Detroit Lions' },
  { id: 'GB', name: 'Green Bay Packers' },
  { id: 'HOU', name: 'Houston Texans' },
  { id: 'IND', name: 'Indianapolis Colts' },
  { id: 'JAX', name: 'Jacksonville Jaguars' },
  { id: 'KC', name: 'Kansas City Chiefs' },
  { id: 'LAC', name: 'Los Angeles Chargers' },
  { id: 'LAR', name: 'Los Angeles Rams' },
  { id: 'LV', name: 'Las Vegas Raiders' },
  { id: 'MIA', name: 'Miami Dolphins' },
  { id: 'MIN', name: 'Minnesota Vikings' },
  { id: 'NE', name: 'New England Patriots' },
  { id: 'NO', name: 'New Orleans Saints' },
  { id: 'NYG', name: 'New York Giants' },
  { id: 'NYJ', name: 'New York Jets' },
  { id: 'PHI', name: 'Philadelphia Eagles' },
  { id: 'PIT', name: 'Pittsburgh Steelers' },
  { id: 'SEA', name: 'Seattle Seahawks' },
  { id: 'SF', name: 'San Francisco 49ers' },
  { id: 'TB', name: 'Tampa Bay Buccaneers' },
  { id: 'TEN', name: 'Tennessee Titans' },
  { id: 'WAS', name: 'Washington Commanders' },
];

export default async function RegisterPage() {
  let teams = FALLBACK_TEAMS;
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('teams')
      .select('id, name')
      .order('name');
    if (data && data.length > 0) {
      teams = data;
    }
  } catch {
    // Fallback bleibt aktiv
  }
  return <RegisterForm teams={teams} />;
}
