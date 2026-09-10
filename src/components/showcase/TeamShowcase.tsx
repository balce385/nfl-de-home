'use client';

/**
 * Fünf Kacheln, die sich auf das gewählte Team beziehen.
 *
 * Das Team kommt aus dem TeamSelectionProvider im Root-Layout, gilt also
 * gemeinsam mit Startseite, Magazin und Stats und überlebt den Seitenwechsel.
 *
 * Spielstand und Rangliste stecken bereits in den Server-Props, Quarterback
 * und News werden beim Teamwechsel nachgeladen.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { StadiumScoreboard } from './StadiumScoreboard';
import { TradingCard } from './TradingCard';
import { MagazineCover } from './MagazineCover';
import { PowerRankings } from './PowerRankings';
import { HighlightBanner } from './HighlightBanner';
import { useTeamSelection } from '@/components/TeamSelectionContext';
import type { Situation } from './LiveDriveTracker';

export type ShowcaseTeam = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logo: string | null;
};

export type ShowcaseStanding = {
  code: string;
  name: string;
  conference: string;
  record: string;
  differential: number;
};

export type ShowcaseArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  accentTeam: string;
  publishedAt: string;
  readingMinutes: number;
};

type QbStats = {
  name: string;
  position: string;
  season?: string;
  stats: { passYards: number; touchdowns: number; interceptions: number; qbr: number };
};

type TeamNews = { headline: string; description: string; link: string | null; published: string | null };

const dateFmt = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

export function TeamShowcase({
  teams,
  standings,
  situations,
  articles,
}: {
  teams: ShowcaseTeam[];
  standings: ShowcaseStanding[];
  situations: Situation[];
  articles: ShowcaseArticle[];
}) {
  const shared = useTeamSelection();
  const local = useState<string>('KC');
  const selected = shared ? shared.selected : local[0];
  const setSelected = shared ? shared.setSelected : local[1];

  const [qb, setQb] = useState<QbStats | null>(null);
  const [news, setNews] = useState<TeamNews | null>(null);

  useEffect(() => {
    let cancelled = false;
    setQb(null);
    setNews(null);

    const team = encodeURIComponent(selected);
    fetch(`/api/team-stats?team=${team}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('stats'))))
      .then((d) => !cancelled && setQb(d))
      .catch(() => {});
    fetch(`/api/team-news?team=${team}&limit=1`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('news'))))
      .then((d) => !cancelled && setNews(d?.articles?.[0] ?? null))
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [selected]);

  const team = teams.find((t) => t.id === selected);
  const teamName = team?.name ?? selected;

  /* --------------------------- 01 Spielstand --------------------------- */
  // Laufendes Spiel des Teams bevorzugen, sonst das zuletzt beendete,
  // sonst das nächste angesetzte.
  const ownGames = situations.filter(
    (s) => s.home.code === selected || s.away.code === selected
  );
  const game =
    ownGames.find((g) => g.state === 'in') ??
    ownGames.find((g) => g.state === 'post') ??
    ownGames[0] ??
    null;

  /* --------------------------- 04 Rangliste ---------------------------- */
  const own = standings.find((s) => s.code === selected);
  const conference = own?.conference;
  const inConference = conference ? standings.filter((s) => s.conference === conference) : standings;
  const ownRank = inConference.findIndex((s) => s.code === selected);
  const colorOf = (code: string) => teams.find((t) => t.id === code)?.color ?? '#666';

  const topFive = inConference.slice(0, 5).map((s, i) => ({
    rank: i + 1,
    code: s.code,
    name: s.record ? `${s.name} (${s.record})` : s.name,
    color: colorOf(s.code),
    differential: s.differential,
  }));
  // Steht das eigene Team nicht in den Top 5, wird seine Zeile angehängt.
  const ranked =
    ownRank >= 5 && own
      ? [
          ...topFive,
          {
            rank: ownRank + 1,
            code: own.code,
            name: own.record ? `${own.name} (${own.record})` : own.name,
            color: colorOf(own.code),
            differential: own.differential,
          },
        ]
      : topFive;

  /* ------------------------ 03/05 Artikel & News ----------------------- */
  const teamArticle = articles.find((a) => a.accentTeam === selected) ?? articles[0];
  const articleDate = teamArticle ? new Date(teamArticle.publishedAt) : null;
  const issue = teamArticle ? articles.length - articles.indexOf(teamArticle) : 0;

  return (
    <div>
      {/* Team-Auswahl */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div>
          <span className="chip-accent chip">Dein Team</span>
          <h2 className="font-display text-3xl font-bold mt-2">
            Alles zu den <span className="grad-text italic">{team?.shortName ?? selected}</span>.
          </h2>
        </div>
        <label className="flex items-center gap-2 card px-3 py-2 ml-auto">
          {team?.logo ? (
            <Image src={team.logo} alt="" width={22} height={22} unoptimized />
          ) : (
            <span className="w-5 h-5 rounded-full" style={{ backgroundColor: team?.color }} />
          )}
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            aria-label="Team auswählen"
            className="bg-transparent text-sm font-medium outline-none cursor-pointer"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id} className="bg-bg text-ink">
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <h3 className="font-display text-lg font-bold mb-3">Spielstand</h3>
          {game ? (
            <StadiumScoreboard
              home={{
                code: game.home.code,
                name: game.home.name,
                score: game.home.score,
                color: game.home.color,
              }}
              away={{
                code: game.away.code,
                name: game.away.name,
                score: game.away.score,
                color: game.away.color,
              }}
              quarter={0}
              clock={game.statusText}
              venue={game.venue || 'NFL Stadium'}
              isLive={game.state === 'in'}
            />
          ) : (
            <div className="card p-5 text-sm text-mute">
              Für {teamName} ist gerade kein Spiel angesetzt.
            </div>
          )}
        </section>

        <section>
          <h3 className="font-display text-lg font-bold mb-3">Quarterback</h3>
          <TradingCard
            name={qb?.name ?? 'Lade …'}
            position={qb?.position ?? 'QB'}
            jersey={0}
            team={selected}
            photoUrl={null}
            stats={[
              {
                label: qb?.season ? `Pass YDS ${qb.season}` : 'Pass YDS',
                value: qb ? qb.stats.passYards.toLocaleString('de-DE') : '—',
              },
              {
                label: 'TD / INT',
                value: qb ? `${qb.stats.touchdowns} / ${qb.stats.interceptions}` : '—',
              },
              { label: 'QBR', value: qb ? String(qb.stats.qbr) : '—' },
            ]}
          />
        </section>

        <section>
          <h3 className="font-display text-lg font-bold mb-3">
            {teamArticle?.accentTeam === selected ? 'Analyse zu deinem Team' : 'Aus dem Magazin'}
          </h3>
          {teamArticle && articleDate ? (
            <MagazineCover
              issue={issue}
              date={dateFmt.format(articleDate)}
              title={teamArticle.title}
              subtitle={teamArticle.excerpt}
              readMinutes={teamArticle.readingMinutes}
              href={`/magazin/${teamArticle.slug}`}
            />
          ) : (
            <div className="card p-5 text-sm text-mute">Noch kein Artikel vorhanden.</div>
          )}
        </section>

        <section>
          <h3 className="font-display text-lg font-bold mb-3">
            Rangliste {conference || ''}
          </h3>
          <PowerRankings teams={ranked} highlight={selected} />
        </section>

        <section className="lg:col-span-2">
          <h3 className="font-display text-lg font-bold mb-3">Neueste Meldung</h3>
          {news ? (
            <HighlightBanner
              label="ESPN"
              title={news.headline}
              description={news.description}
              metric={selected}
              matchup={teamName}
              href={news.link ?? '#'}
            />
          ) : (
            <div className="card p-5 text-sm text-mute">
              {news === null ? 'Lade Meldungen …' : `Keine aktuelle Meldung zu ${teamName}.`}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
