import { AlertTriangle } from 'lucide-react';
import { siteOwner, ownerAddressComplete } from '@/data/site-owner';

export const metadata = {
  title: 'Impressum',
  description: 'Anbieterkennzeichnung nach § 5 DDG für nfl-fan-app.de.',
  robots: { index: false, follow: true },
};

export default function ImpressumPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <span className="chip">Rechtliches</span>
      <h1 className="font-display text-5xl font-bold mt-4">Impressum</h1>
      <p className="text-mute mt-3">Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG).</p>

      {!ownerAddressComplete && (
        <div className="card p-5 mt-8 border-warn/50">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-warn shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-warn">Diese Seite ist noch unvollständig.</p>
              <p className="text-mute mt-1 leading-relaxed">
                Es fehlt die ladungsfähige Anschrift des Betreibers. Sie ist für eine öffentlich
                erreichbare Website gesetzlich vorgeschrieben und muss vom Betreiber selbst
                eingetragen werden — in{' '}
                <code className="font-mono text-ink">src/data/site-owner.ts</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6 mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-bold mb-2">Diensteanbieter</h2>
          <address className="not-italic text-mute space-y-0.5">
            <div className="text-ink font-semibold">{siteOwner.name}</div>
            <div>{siteOwner.street || <Missing>Straße und Hausnummer</Missing>}</div>
            <div>
              {siteOwner.postalCode || <Missing>PLZ</Missing>}{' '}
              {siteOwner.city || <Missing>Ort</Missing>}
            </div>
            <div>{siteOwner.country}</div>
          </address>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-2">Kontakt</h2>
          <p className="text-mute">
            E-Mail:{' '}
            <a href={`mailto:${siteOwner.email}`} className="text-primary hover:underline">
              {siteOwner.email}
            </a>
          </p>
          {siteOwner.phone && <p className="text-mute mt-1">Telefon: {siteOwner.phone}</p>}
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-2">
            Verantwortlich für den Inhalt
          </h2>
          <p className="text-mute">
            {siteOwner.name}
            {ownerAddressComplete && `, ${siteOwner.street}, ${siteOwner.postalCode} ${siteOwner.city}`}
          </p>
        </section>

        {siteOwner.vatId && (
          <section>
            <h2 className="font-display text-lg font-bold mb-2">Umsatzsteuer-ID</h2>
            <p className="text-mute">{siteOwner.vatId}</p>
          </section>
        )}

        <section>
          <h2 className="font-display text-lg font-bold mb-2">Art des Angebots</h2>
          <p className="text-mute">
            Dieses Angebot ist ein privates, nicht-kommerzielles Projekt. Es ist kostenlos, enthält
            keine Werbung und verfolgt keine Gewinnerzielungsabsicht.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-2">Haftung für Inhalte</h2>
          <p className="text-mute">
            Für eigene Inhalte auf diesen Seiten bin ich nach den allgemeinen Gesetzen
            verantwortlich. Ich bin nicht verpflichtet, übermittelte oder gespeicherte fremde
            Informationen zu überwachen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung
            von Informationen nach den allgemeinen Gesetzen bleiben davon unberührt. Eine Haftung
            ist erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich; bei
            Bekanntwerden entsprechender Rechtsverletzungen entferne ich diese Inhalte umgehend.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-2">Haftung für Links</h2>
          <p className="text-mute">
            Dieses Angebot verlinkt auf externe Websites, auf deren Inhalte ich keinen Einfluss
            habe. Für diese fremden Inhalte ist stets deren Anbieter verantwortlich. Zum Zeitpunkt
            der Verlinkung waren keine Rechtsverstöße erkennbar. Werden mir Rechtsverletzungen
            bekannt, entferne ich solche Links umgehend.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-2">Marken und Urheberrecht</h2>
          <p className="text-mute">
            Dieses Angebot steht in keiner Verbindung zur National Football League (NFL) und wird
            von ihr weder betrieben noch unterstützt oder geprüft. NFL, die Teamnamen und die
            Teamlogos sind Marken ihrer jeweiligen Inhaber und werden hier ausschließlich zur
            Beschreibung der dargestellten Sportereignisse verwendet.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold mb-2">Streitschlichtung</h2>
          <p className="text-mute">
            Ich bin nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>
      </div>
    </div>
  );
}

function Missing({ children }: { children: React.ReactNode }) {
  return <span className="text-warn font-mono text-xs">[{children} fehlt]</span>;
}
