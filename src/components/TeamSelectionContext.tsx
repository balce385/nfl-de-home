'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

/**
 * Das vom Nutzer gewählte Lieblingsteam — geteilt über die ganze Seite
 * (Startseiten-Kacheln, Team-Auswahl, Magazin-News) und im Browser gespeichert,
 * damit die Wahl einen Seitenwechsel und den nächsten Besuch übersteht.
 */

const STORAGE_KEY = 'nfl-de:team';
const DEFAULT_TEAM = 'KC';

type TeamSelection = {
  selected: string;
  setSelected: (code: string) => void;
  /** false, solange der gespeicherte Wert noch nicht gelesen wurde (SSR/erster Render). */
  ready: boolean;
};

const TeamSelectionContext = createContext<TeamSelection | null>(null);

export function TeamSelectionProvider({
  children,
  initial = DEFAULT_TEAM,
}: {
  children: ReactNode;
  initial?: string;
}) {
  const [selected, setSelectedState] = useState(initial);
  const [ready, setReady] = useState(false);

  // Erst nach dem Mount lesen: Server und Client rendern sonst
  // unterschiedliches Markup (Hydration-Fehler).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setSelectedState(stored);
    } catch {
      // Privater Modus oder blockierte Storage-API — Standardteam bleibt aktiv.
    }
    setReady(true);
  }, []);

  const setSelected = useCallback((code: string) => {
    setSelectedState(code);
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Auswahl gilt dann nur für diese Sitzung.
    }
  }, []);

  return (
    <TeamSelectionContext.Provider value={{ selected, setSelected, ready }}>
      {children}
    </TeamSelectionContext.Provider>
  );
}

/**
 * Liefert das gewählte Team. Gibt null zurück, wenn die Komponente außerhalb
 * eines Providers gerendert wird — dann nutzt sie ihren eigenen lokalen State.
 */
export function useTeamSelection(): TeamSelection | null {
  return useContext(TeamSelectionContext);
}
