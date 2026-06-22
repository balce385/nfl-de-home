'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

/**
 * Teilt das aktuell gewählte Team zwischen mehreren Sektionen der Startseite
 * (Vorschau-Karte "Daten, die du verstehst" + Team-Auswahl "Wähle dein Team").
 */

type TeamSelection = {
  selected: string;
  setSelected: (code: string) => void;
};

const TeamSelectionContext = createContext<TeamSelection | null>(null);

export function TeamSelectionProvider({
  children,
  initial = 'KC',
}: {
  children: ReactNode;
  initial?: string;
}) {
  const [selected, setSelected] = useState(initial);
  return (
    <TeamSelectionContext.Provider value={{ selected, setSelected }}>
      {children}
    </TeamSelectionContext.Provider>
  );
}

/**
 * Liefert den geteilten Team-Status – oder null, wenn die Komponente außerhalb
 * eines Providers gerendert wird (dann nutzt sie ihren eigenen lokalen State).
 */
export function useTeamSelection(): TeamSelection | null {
  return useContext(TeamSelectionContext);
}
