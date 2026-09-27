/**
 * Redaktionelle Artikel mit vollem Text — Stand: 27. September 2026. Neueste zuerst.
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
  /** Weiterführende Seite, unter dem Text verlinkt. */
  related?: { href: string; label: string };
};

export const fullArticles: FullArticle[] = [
  {
    slug: 'nfl-week-2-2026-zahlen-saisonstart',
    category: 'Analyse',
    categoryColor: 'primary',
    accentTeam: 'NFL',
    accentColor: 'blue',
    title: 'Nach Week 2: Die Zahlen hinter dem NFL-Saisonstart',
    excerpt:
      'Acht Teams sind ungeschlagen, aber nicht alle überzeugen: Die 49ers dominieren, die Eagles zittern sich durch, und die Patriots stellen vor dem Munich Game die beste Defense.',
    publishedAt: '2026-09-27',
    readingMinutes: 5,
    source: 'ESPN (Ergebnisse und Statistiken)',
    sourceUrl: 'https://www.espn.com/nfl/scoreboard',
    related: { href: '/news', label: 'Live-Ergebnisse und Tabelle aller Divisionen' },
    body: `Zwei Spieltage sind gespielt, und die Tabelle sortiert sich schon grob: Acht Teams stehen bei 2-0, acht bei 0-2, der Rest bei 1-1. Eine Bilanz allein sagt nach zwei Spielen aber wenig. Aussagekräftiger ist die Punktedifferenz, also erzielte minus kassierte Punkte. Sie zeigt, wer seine Spiele kontrolliert und wer knapp davongekommen ist.

Die Top 5 nach Punktedifferenz

1. San Francisco 49ers (2-0, +42): Zum Auftakt 27:7 gegen die Rams im Melbourne Cricket Ground, dem ersten NFL-Spiel in Australien, dann 35:13 gegen Miami. Brock Purdy brachte gegen die Dolphins 20 von 22 Pässen an, für 287 Yards und zwei Touchdowns. Mehr Kontrolle geht kaum.
2. Seattle Seahawks (2-0, +27): Erst ein 13:10 gegen New England, dann ein 31:7 in Arizona. Dort fing Jaxon Smith-Njigba 9 Bälle für 155 Yards und drei Touchdowns.
3. Las Vegas Raiders (2-0, +26): 27:13 gegen Miami, 26:14 bei den Chargers. Kirk Cousins warf in Los Angeles drei Touchdown-Pässe.
4. Kansas City Chiefs (2-0, +24): Nach seiner Knieverletzung ist Patrick Mahomes zurück, und wie. Beim 33:30 gegen die Colts kam er auf 382 Yards und drei Touchdowns, Travis Kelce fing neun Bälle. Zum Auftakt gab es ein 31:10 gegen Denver.
5. Minnesota Vikings (2-0, +23): Ein 39:22 gegen Green Bay und ein 9:3 in Chicago. Zwei Siege, die unterschiedlicher kaum sein könnten.

Ungeschlagen, aber mit Fragezeichen

Die Buffalo Bills stehen bei 2-0, haben aber schon 62 Punkte kassiert, so viele wie kein anderes ungeschlagenes Team. Beide Siege waren Shootouts: 36:31 in Houston, 41:31 gegen Detroit. Noch knapper wird es bei den Philadelphia Eagles. 24:22 gegen Washington, 24:20 in Tennessee, dazu zwei Interceptions von Jalen Hurts in Week 2. Eine Differenz von +6 ist die schwächste aller 2-0-Teams.

Die Munich-Game-Teams: beide 1-1

Die Detroit Lions, am 15. November Gastgeber in der Allianz Arena, haben ein 31:30 gegen New Orleans und ein 31:41 in Buffalo hinter sich. Die Offensive läuft: Jared Goff warf in Buffalo vier Touchdown-Pässe, Amon-Ra St. Brown fing 9 Bälle für 142 Yards und zwei Touchdowns. Das Problem sind 71 Gegenpunkte in zwei Spielen.

Bei den New England Patriots ist es umgekehrt. Sie haben erst 16 Punkte zugelassen, das ist der Bestwert der Liga. Nach dem 10:13 in Seattle kam ein souveränes 20:3 gegen Pittsburgh. Treffen in München die beste Defense und eine der gefährlichsten Offensiven aufeinander, wird es spannend.

Ganz unten

Die Atlanta Falcons hatten nach zwei Spielen mit -38 die schlechteste Differenz der Liga, allein das 3:34 gegen Carolina tat weh. Am Donnerstag kam die Antwort: ein 35:14 in Green Bay, damit stehen sie bei 1-2. Die Miami Dolphins (-36) und die Los Angeles Chargers (-24) warten dagegen weiter auf ihren ersten Sieg.

Kurios: Die Chicago Bears erzielten in Week 1 beim 59:37 in Carolina 59 Punkte, D'Andre Swift lief für drei Touchdowns. Eine Woche später gelangen ihnen beim 3:9 gegen Minnesota ganze drei Punkte.

Was Week 3 bringt

Heute Abend geht es ab 19 Uhr deutscher Zeit weiter, unter anderem mit Lions gegen Jets, Patriots in Jacksonville und Chiefs in Miami. Um 22:25 Uhr folgt das nächste Auslandsspiel: Ravens gegen Cowboys im Maracanã-Stadion in Rio de Janeiro. Die Nacht zum Dienstag schließt Eagles gegen Bears ab. Alle Ergebnisse gibt es live auf unserer News-Seite.`,
  },
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
    related: { href: '/nfl-munich-game-2026', label: 'Alle Infos zum Munich Game: Tickets, TV, Anreise' },
    body: `Deutschland bekommt sein nächstes NFL-Spiel — und es ist ein Kracher: Am Sonntag, 15. November 2026, treffen die New England Patriots in der Allianz Arena in München auf die Detroit Lions.

Für deutsche Fans ist die Partie doppelt besonders. Mit Amon-Ra St. Brown steht einer der besten Receiver der Liga auf dem Feld — und einer, der dank seiner deutschen Mutter und fließender Deutschkenntnisse längst zum Gesicht der NFL in Deutschland geworden ist. Sein Auftritt in München dürfte der emotionale Höhepunkt des NFL-Jahres hierzulande werden.

Der Ticketverkauf lief exklusiv über die offiziellen Kanäle der NFL. Erfahrungsgemäß übersteigt die Nachfrage das Angebot um ein Vielfaches — beim ersten Munich Game 2022 wollten rund drei Millionen Menschen Tickets für ein Stadion mit etwa 70.000 Plätzen.

Auch die langfristige Perspektive steht: Die NFL hat sich verpflichtet, 2026 und 2028 in der Allianz Arena zu spielen. Detroit hält seit 2024 die Marketingrechte der NFL für Deutschland, Österreich und die Schweiz.

Update 27. September 2026: Der Anstoß ist bestätigt — 15:30 Uhr deutscher Zeit, live und kostenlos bei RTL. Die Tickets sind ausverkauft, die Halbzeitshow spielt die US-Rockband Cage The Elephant. Alles Weitere zu Anreise und Restkarten steht auf unserer Seite zum Munich Game.`,
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
