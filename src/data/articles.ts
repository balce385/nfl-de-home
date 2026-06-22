/**
 * Redaktionelle Artikel mit vollem Text — Stand: 11. Juni 2026.
 * Quelle der Fakten: ESPN, AP/US News, CBS Sports, NFL.com, footballdb (siehe sourceUrl).
 * Diese Datei ist die lokale "Datenbank" fürs Magazin; Supabase-Artikel
 * (News-Scraper) werden zusätzlich angezeigt, sobald die DB gefüllt ist.
 */
import type { Article } from '@/types';

export type FullArticle = Article & {
  body: string;
  source?: string;
  sourceUrl?: string;
  teamId?: string;
};

export const fullArticles: FullArticle[] = [
  {
    slug: 'mahomes-mega-vertrag-2033',
    category: 'News',
    categoryColor: 'primary',
    accentTeam: 'KC',
    accentColor: 'red',
    title: 'Mahomes bis 2033: Chiefs schnüren 504-Millionen-Paket',
    excerpt:
      'Die Chiefs und Patrick Mahomes haben den Vertrag umstrukturiert: zwei Jahre mehr, über eine halbe Milliarde Dollar Gesamtvolumen — mitten in seiner Reha nach Knie-OP.',
    publishedAt: '2026-06-11',
    readingMinutes: 5,
    teamId: 'KC',
    source: 'AP / US News',
    sourceUrl:
      'https://www.usnews.com/news/sports/articles/2026-06-10/chiefs-lock-in-patrick-mahomes-through-2033-with-a-504-75m-reworked-deal-ap-source-says',
    body: `Es ist die Schlagzeile dieser Offseason: Die Kansas City Chiefs und Patrick Mahomes haben sich am Mittwoch auf eine Umstrukturierung seines Vertrags geeinigt. Der Deal hängt zwei zusätzliche Jahre an und hebt das Gesamtvolumen laut AP-Quelle auf 504,75 Millionen Dollar — Mahomes ist damit bis 2033 an Kansas City gebunden.

Bemerkenswert ist der Zeitpunkt. Mahomes arbeitet seit Januar an seinem Comeback nach dem Riss von Kreuzband (ACL) und Außenband (LCL) im linken Knie. Dass die Franchise ausgerechnet jetzt langfristige Planungssicherheit schafft, ist ein klares Statement: Man hat keinerlei Zweifel an der vollständigen Genesung des zweimaligen MVP.

Und die Bilder vom Minicamp (9. bis 11. Juni) stützen das. Im 7-gegen-7 zeigte Mahomes fünf Monate nach der OP bereits den gewohnten Zug und die gewohnte Präzision — mit voluminöser Schiene am linken Bein. Die 11-gegen-11-Perioden ließ er noch aus; das volle Pensum ist erst für das Training Camp geplant.

Head Coach Andy Reid lobte öffentlich die Reha-Disziplin seines Quarterbacks: Er liebe, wie Mahomes die Rehabilitation angegangen sei, und sehe ihn auf Kurs für das Camp. Auch Erstrunden-Pick Mansoor Delane, Cornerback aus der Draft-Klasse 2026, bekam von Reid ein Update — der Rookie soll zum Camp voll einsatzfähig sein.

Für die Offense bedeutet das: Die spannendste Frage des Sommers ist nicht ob, sondern wie Mahomes zurückkommt. Die Anpassungen im Playbook — mehr 11-Personnel, kürzere Passrouten, weniger Play-Action — deuten darauf hin, dass die Chiefs die Belastung ihres Franchise-Quarterbacks gezielt steuern wollen, zumindest in den ersten Wochen der Saison 2026.`,
  },
  {
    slug: 'nfl-munich-game-2026-patriots-lions',
    category: 'Community',
    categoryColor: 'warn',
    accentTeam: 'DACH',
    accentColor: 'blue',
    title: 'Munich Game 2026: Patriots vs. Lions am 15. November in der Allianz Arena',
    excerpt:
      'Es ist offiziell: New England trifft auf Detroit mit Amon-Ra St. Brown. Alles zu Tickets, Anstoßzeit und den Deutschland-Spielen bis 2029.',
    publishedAt: '2026-06-10',
    readingMinutes: 4,
    source: 'NFL.com',
    sourceUrl: 'https://www.nfl.com/international/games/munich/',
    body: `Deutschland bekommt sein nächstes NFL-Spiel — und es ist ein Kracher: Am Sonntag, 15. November 2026, treffen die New England Patriots in der Allianz Arena in München auf die Detroit Lions.

Für deutsche Fans ist die Partie doppelt besonders. Mit Amon-Ra St. Brown steht einer der besten Receiver der Liga auf dem Feld — und einer, der dank seines deutschen Vaters und fließender Deutschkenntnisse längst zum Gesicht der NFL in Deutschland geworden ist. Sein Auftritt in München dürfte der emotionale Höhepunkt des NFL-Jahres hierzulande werden.

Der Ticketverkauf lief exklusiv über Ticketmaster; der öffentliche Verkauf startete bereits am 10. Juli. Erfahrungsgemäß übersteigt die Nachfrage das Angebot um ein Vielfaches — beim ersten Munich Game 2022 wollten rund drei Millionen Menschen Tickets für ein Stadion mit etwa 70.000 Plätzen.

Die langfristige Perspektive steht ebenfalls: Die NFL hat sich mit München (2026, 2028) und Berlin (2027, 2029) auf einen festen Deutschland-Rhythmus verständigt. Das Olympiastadion Berlin und die Allianz Arena wechseln sich ab — Planungssicherheit für Fans, die das Event mit einer Reise verbinden wollen.

Unsere Community organisiert wie immer Watchpartys in mehreren Städten, Fahrgemeinschaften nach München und einen gemeinsamen Tailgate-Treffpunkt. Details folgen im Community-Bereich, sobald die Anstoßzeit final bestätigt ist (erwartet: 15:30 Uhr deutscher Zeit).`,
  },
  {
    slug: 'rookie-klasse-2026-minicamps',
    category: 'Draft',
    categoryColor: 'primary',
    accentTeam: 'NFL',
    accentColor: 'blue',
    title: 'Die Rookie-Klasse 2026 nach den Minicamps — wer überzeugt?',
    excerpt:
      'Mendoza in Vegas, Delane in Kansas City, Tate in Tennessee: erste Eindrücke von den Top-Picks — und warum zwei Erstrunden-QBs noch keinen Vertrag haben.',
    publishedAt: '2026-06-09',
    readingMinutes: 7,
    source: 'CBS Sports / NFL.com',
    sourceUrl: 'https://www.cbssports.com/nfl/news/what-we-learned-2026-nfl-rookie-minicamps/',
    body: `Die Rookie-Minicamps sind durch, die Mandatory Minicamps laufen — Zeit für eine erste Bestandsaufnahme der Draft-Klasse 2026.

Ganz oben steht naturgemäß Fernando Mendoza. Der Quarterback aus Indiana ging an Nummer 1 zu den Las Vegas Raiders — der erste Hoosier in Runde eins seit 1994. In Vegas ruhen alle Hoffnungen auf dem Neuaufbau um ihn herum. Pikant: Laut CBS-Vertragstracker waren Mendoza und Alabama-QB Ty Simpson zuletzt die einzigen Erstrunden-Picks ohne unterschriebenen Rookie-Vertrag. Grund zur Panik ist das nicht — solche Verzögerungen drehen sich meist um Garantie-Strukturen, nicht ums Geld an sich.

Dahinter verteilt sich das Talent quer durch die Liga: Die Cardinals investierten den dritten Pick in einen Running Back mit Star-Potenzial, die Titans holten an vier Receiver Carnell Tate, die Giants an zehn Francis Mauigoa. Und die Chiefs schlossen mit Cornerback Mansoor Delane an Position sechs die größte Lücke ihrer Secondary — Andy Reid bestätigte im Juni, dass Delane zum Training Camp voll einsatzfähig sein wird.

Einen Sonderweg gingen die Detroit Lions: Sie sagten ihr Rookie-Minicamp komplett ab — als einziges Team — und schickten die Neuzugänge stattdessen direkt in die OTAs ab Ende Mai. Erste Eindrücke von Pick 17 Blake Miller gab es deshalb später als bei der Konkurrenz.

Was heißt das für Saison 2026? Die Klasse gilt als tief bei Receivern und in der Secondary. Wer in Dynasty-Ligen spielt, sollte die Sommer-Berichte aus den Camps genau verfolgen — gerade bei den Day-2-Picks entscheidet sich jetzt, wer ab Week 1 echte Snaps sieht.`,
  },
  {
    slug: 'ravens-defense-2025-bilanz',
    category: 'Analyse',
    categoryColor: 'primary',
    accentTeam: 'BAL',
    accentColor: 'purple',
    title: 'Baltimores Defense 2025: Die Zahlen hinter dem Mittelmaß',
    excerpt:
      'Platz 19 bei den zugelassenen Yards, starke Pass-Defense, anfällige Run-Defense — der Datenrückblick auf eine Ravens-Saison der zwei Gesichter.',
    publishedAt: '2026-06-07',
    readingMinutes: 6,
    teamId: 'BAL',
    source: 'footballdb',
    sourceUrl: 'https://www.footballdb.com/statistics/nfl/team-stats/defense-totals',
    body: `Der Ruf der Ravens-Defense eilt ihr voraus — die Zahlen der Saison 2025 erzählen eine differenziertere Geschichte.

Unterm Strich ließ Baltimore 5.974 Yards zu, Platz 19 der Liga. Für eine Franchise, deren Identität seit Ray Lewis auf der Defense gebaut ist, ist das Mittelmaß. Der Blick in die Splits zeigt aber zwei sehr unterschiedliche Einheiten.

Gegen den Pass war Baltimore richtig gut: 3.503 zugelassene Passing-Yards bedeuteten Rang 10. Die Kombination aus variablen Coverage-Schemes und einem Pass-Rush, der auch ohne konstante Blitzes Druck erzeugt, funktionierte über weite Strecken.

Das Problem war die Run-Defense: 2.001 zugelassene Rushing-Yards, nur Rang 18. Teams, die geduldig den Lauf durchzogen, kontrollierten gegen Baltimore die Uhr — und hielten Lamar Jacksons Offense von der eigenen Stärke fern. Genau dieses Muster zog sich durch die engen Niederlagen der Saison.

Die Offseason-Antwort darauf wird das spannendste Ravens-Thema 2026: Investiert das Front Office in die Interior-D-Line, oder vertraut man auf interne Entwicklung? Die Draft-Klasse 2026 galt in der Secondary als tief, auf der D-Line weniger — was dafür spricht, dass Baltimore das Problem über Free-Agency-Veteranen löst.

Fazit: Wer die Ravens 2026 bewerten will, sollte nicht auf den Namen schauen, sondern auf die Front Seven. Hält sie gegen den Lauf, ist diese Defense Top-10-Material. Hält sie nicht, wiederholt sich 2025.`,
  },
  {
    slug: 'best-ball-sleeper-2026',
    category: 'Fantasy',
    categoryColor: 'accent',
    accentTeam: 'FF',
    accentColor: 'emerald',
    title: 'Best-Ball 2026: Drei Profile, die du jetzt draften solltest',
    excerpt:
      'ADP-Ineffizienzen entstehen im Juni — wer jetzt draftet, kauft Unsicherheit zum Discount. Drei Spielertypen, bei denen sich das auszahlt.',
    publishedAt: '2026-06-08',
    readingMinutes: 5,
    body: `Juni ist Best-Ball-Monat: Die ADPs (Average Draft Positions) sind noch von der Vorsaison geprägt, während sich in den Minicamps längst neue Hierarchien abzeichnen. Genau in dieser Lücke entsteht Value. Drei Profile, auf die wir jetzt gezielt draften:

1. Der Zweitjahres-Receiver mit Zielvolumen-Sprung. Receiver machen den größten Leistungssprung typischerweise zwischen Jahr eins und zwei. Wer als Rookie bereits 90+ Targets gesehen hat, aber wegen mäßiger Effizienz im ADP gefallen ist, wird im Juni systematisch unterbewertet. Volumen ist die stabilste Währung im Fantasy Football — Effizienz schwankt, Targets bleiben.

2. Der Starting-QB nach Knie-Verletzung. Quarterbacks, die nach schweren Verletzungen zurückkommen, werden im Sommer regelmäßig zu tief gedraftet — der prominenteste Fall dieser Offseason spielt in Kansas City. Die Reha-Berichte aus dem Minicamp sind positiv, das Camp-Pensum ist geplant, der Vertrag spricht Bände über das interne Vertrauen. Im Best-Ball-Format, wo eine schwache Frühphase durch starke Spätsaison-Wochen ausgeglichen wird, ist das Risikoprofil ideal.

3. Der Rookie-RB in einem Lauf-Vakuum. Die Cardinals haben den dritten Gesamtpick in einen Running Back investiert — so früh drafted kein Team einen RB, den es nicht ab Woche eins als Workhorse plant. Historisch liefern Top-5-RB-Picks im Rookie-Jahr fast immer RB2-Wert oder besser, der ADP preist aber regelmäßig nur RB3-Erwartung ein.

Genereller Rat: Im Juni gewinnt man Best-Ball-Drafts nicht über die ersten drei Runden, sondern über die Runden 8 bis 14 — dort sitzen die Spieler, deren Sommer-News den ADP noch um zwei Runden bewegen werden. Wer früh draftet, bekommt diese Bewegung geschenkt.`,
  },
  {
    slug: 'dynasty-trade-guide-offseason-2026',
    category: 'Fantasy',
    categoryColor: 'accent',
    accentTeam: 'FF',
    accentColor: 'emerald',
    title: 'Dynasty Offseason Guide: Buy Low, Sell High',
    excerpt:
      'Die Offseason ist Trade-Saison: Wo Regression droht, wo Aufwertung wartet — sechs Prinzipien für Dynasty-Manager im Sommer 2026.',
    publishedAt: '2026-06-05',
    readingMinutes: 8,
    body: `Zwischen Draft und Training Camp werden Dynasty-Ligen gewonnen. Die News-Lage ist dünn, die Emotionen aus der Vorsaison sind verflogen — bessere Bedingungen für rationale Trades gibt es nicht. Sechs Prinzipien, nach denen wir aktuell handeln:

1. Verkaufe Touchdown-Überperformer. Spieler, deren Vorsaison-Wert überproportional an Touchdowns hing, sind die klassischen Sell-High-Kandidaten. Touchdown-Raten regressieren stärker zur Mitte als jede andere Kennzahl. Wer 2025 mit zweistelliger TD-Quote bei moderatem Volumen abgeschlossen hat, wird aktuell zu Höchstpreisen gehandelt.

2. Kaufe Volumen ohne Glanz. Das Spiegelbild: Spieler mit hohem Snap- und Target-Anteil, aber schwacher TD-Ausbeute, sind im Juni günstig. Das Volumen kommt wieder, die Touchdowns normalisieren sich nach oben.

3. Kaufe verletzte Stars vor dem Camp-Hype. Der Preis eines rehabilitierenden Stars steigt mit jedem positiven Camp-Bericht. Der optimale Kaufzeitpunkt ist jetzt — nach der Verunsicherung der Verletzung, vor den ersten Comeback-Schlagzeilen. Die Minicamp-Berichte dieser Woche (Stichwort Kansas City) zeigen, wie schnell sich das Fenster schließt.

4. Verkaufe Alter in Kontender-Rostern nie unter Wert. Dass ein Spieler 29 ist, macht ihn für ein Rebuild-Team wertlos — für einen Kontender ist er genau das fehlende Puzzlestück. Alters-Discounts akzeptiert man nur, wenn der eigene Kader sie rechtfertigt.

5. Rookie-Picks 2027 sind im Juni am billigsten. Direkt nach dem Draft 2026 ist die Pick-Müdigkeit am größten und Zukunfts-Picks werden verramscht. Die Klasse 2027 gilt bei Quarterbacks als stark — Future Firsts jetzt einsammeln.

6. Handle Unsicherheit, nicht Gewissheit. Der Markt preist Gewissheit voll ein. Profit entsteht dort, wo eine binäre Frage (Comeback ja/nein, Starter ja/nein) offen ist und du eine begründete Meinung hast. Die Camp-Berichte ab Juli liefern die Antworten — positioniere dich vorher.`,
  },
];

export const articles: Article[] = fullArticles.map(
  ({ body: _b, source: _s, sourceUrl: _u, teamId: _t, ...meta }) => meta
);

export function getArticle(slug: string): FullArticle | undefined {
  return fullArticles.find((a) => a.slug === slug);
}
