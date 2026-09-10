import { AlertTriangle } from 'lucide-react';
import { siteOwner, ownerAddressComplete } from '@/data/site-owner';

export const metadata = {
  title: 'Datenschutzerklärung',
  description:
    'Welche Daten dieses Angebot verarbeitet, wo sie liegen und welche Rechte du hast — in Klartext.',
  robots: { index: false, follow: true },
};

export default function DatenschutzPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <span className="chip">Rechtliches</span>
      <h1 className="font-display text-5xl font-bold mt-4">Datenschutz.</h1>
      <p className="text-mute mt-3 text-lg">
        Kurzfassung: kein Tracking, keine Werbung, keine Weitergabe. Ohne Konto werden nur
        Server-Logs geschrieben. Alles Weitere steht unten.
      </p>

      {!ownerAddressComplete && (
        <div className="card p-5 mt-8 border-warn/50">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-warn shrink-0 mt-0.5" />
            <p className="text-sm text-mute">
              Die Anschrift des Verantwortlichen fehlt noch und muss in{' '}
              <code className="font-mono text-ink">src/data/site-owner.ts</code> eingetragen werden.
            </p>
          </div>
        </div>
      )}

      <div className="card p-6 mt-8 space-y-7 text-sm leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-bold mb-2">1. Verantwortlicher</h2>
          <address className="not-italic text-mute space-y-0.5">
            <div className="text-ink font-semibold">{siteOwner.name}</div>
            {ownerAddressComplete ? (
              <>
                <div>{siteOwner.street}</div>
                <div>
                  {siteOwner.postalCode} {siteOwner.city}
                </div>
              </>
            ) : (
              <div className="text-warn font-mono text-xs">[Anschrift fehlt]</div>
            )}
            <div>{siteOwner.country}</div>
            <div>
              <a href={`mailto:${siteOwner.email}`} className="text-primary hover:underline">
                {siteOwner.email}
              </a>
            </div>
          </address>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-2">2. Server-Logs</h2>
          <p className="text-mute">
            Beim Aufruf jeder Seite schreibt der Webserver einen Eintrag mit IP-Adresse,
            Zeitpunkt, aufgerufener Adresse, Browser-Kennung und übertragener Datenmenge. Das ist
            technisch nötig, um die Seite auszuliefern und Angriffe zu erkennen.
          </p>
          <p className="text-mute mt-2">
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am sicheren
            Betrieb). Die Protokolle rollieren automatisch und werden nicht mit anderen Daten
            zusammengeführt.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-2">3. Hosting</h2>
          <p className="text-mute">
            Die Seite läuft auf einem Server der netcup GmbH, Emmy-Noether-Straße 10, 76131
            Karlsruhe, im Rechenzentrum Nürnberg. Die Daten verlassen dabei die Europäische Union
            nicht. Grundlage ist ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-2">4. Konto, Chat und Watchlist</h2>
          <p className="text-mute">
            Diese Funktionen gibt es nur mit Konto. Dafür werden E-Mail-Adresse, ein
            Passwort-Hash, ein frei wählbarer Anzeigename sowie die von dir geschriebenen
            Nachrichten und gemerkten Spieler gespeichert. Rechtsgrundlage ist Art. 6 Abs. 1
            lit. b DSGVO (Erfüllung des Nutzungsverhältnisses).
          </p>
          <p className="text-mute mt-2">
            Diese Daten liegen bei Supabase (Supabase Inc.) in der AWS-Region <em>eu-west-1</em>{' '}
            (Irland), also innerhalb der EU. Nachrichten im Chat sind für andere angemeldete
            Nutzer sichtbar — schreib dort nichts, was privat bleiben soll.
          </p>
          <p className="text-mute mt-2">
            Zur Anmeldung setzt Supabase ein technisch notwendiges Sitzungs-Cookie. Es dient
            allein dem Login und wird nicht zur Analyse verwendet.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-2">5. Kein Tracking, keine Werbung</h2>
          <p className="text-mute">
            Es sind keine Analyse-Dienste, keine Werbenetzwerke und keine Social-Media-Plugins
            eingebunden. Es gibt kein Profiling, keine Weitergabe an Dritte zu Werbezwecken und
            keine Cookie-Einwilligung, weil außer dem Sitzungs-Cookie nichts gesetzt wird.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-2">6. Externe Datenquellen</h2>
          <p className="text-mute">
            Spielstände, Statistiken und News kommen von öffentlichen Schnittstellen — vor allem
            von ESPN, ergänzt um offene Daten von nflverse, TheSportsDB und YouTube-RSS-Feeds.
            Diese Abfragen laufen <strong className="text-ink">über unseren Server</strong>, nicht
            über deinen Browser. Deine IP-Adresse wird dabei nicht an diese Anbieter übertragen.
          </p>
          <p className="text-mute mt-2">
            Ausnahme sind Bilder in den News: Sie werden direkt von den Servern der jeweiligen
            Quelle geladen, wodurch deine IP-Adresse dorthin übertragen wird. Klickst du eine News
            an, verlässt du diese Seite und es gilt die Datenschutzerklärung des Anbieters.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-2">7. Speicherdauer</h2>
          <p className="text-mute">
            Kontodaten bleiben gespeichert, solange das Konto besteht. Löschst du es, werden dein
            Profil und deine Watchlist entfernt. Server-Logs werden automatisch überschrieben.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-2">8. Deine Rechte</h2>
          <p className="text-mute">
            Du hast das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17),
            Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und
            Widerspruch (Art. 21 DSGVO). Eine Nachricht an{' '}
            <a href={`mailto:${siteOwner.email}`} className="text-primary hover:underline">
              {siteOwner.email}
            </a>{' '}
            genügt.
          </p>
          <p className="text-mute mt-2">
            Angemeldete Nutzer können ihre Daten außerdem direkt im Konto unter{' '}
            <em>Profil</em> exportieren und das Konto dort selbst löschen.
          </p>
          <p className="text-mute mt-2">
            Du kannst dich zudem bei einer Datenschutz-Aufsichtsbehörde beschweren, etwa der für
            deinen Wohnort zuständigen Landesbeauftragten für den Datenschutz.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-2">9. Änderungen</h2>
          <p className="text-mute">
            Ändert sich etwas an der Verarbeitung, wird diese Erklärung angepasst. Stand:
            September 2026.
          </p>
        </section>
      </div>
    </div>
  );
}
