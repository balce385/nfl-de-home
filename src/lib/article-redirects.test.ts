import { describe, expect, it } from 'vitest';
import { movedArticlePath } from './article-redirects';

const map = {
  'lions-signs-db-jalen-mills-p=420406': 'lions-sign-db-jalen-mills-1a2b3c4d',
  'tyson-bagent-clears-gehirnerschütterung-protokoll-nfl639278': 'tyson-bagent-clears-concussion-protocol-9f8e7d6c',
  'vikings-rb-jones-knie-frei-für-start-N-50028887': 'vikings-rb-jones-knee-cleared-to-start-0a0b0c0d',
};

describe('movedArticlePath', () => {
  it('alter Slug mit "/?p=" in Pfad und Query zerlegt', () => {
    // vor und nach Next.js' Umleitung ohne Schraegstrich am Ende
    expect(movedArticlePath('/magazin/lions-signs-db-jalen-mills-/', '?p=420406', map)).toBe(
      '/magazin/lions-sign-db-jalen-mills-1a2b3c4d'
    );
    expect(movedArticlePath('/magazin/lions-signs-db-jalen-mills-', '?p=420406', map)).toBe(
      '/magazin/lions-sign-db-jalen-mills-1a2b3c4d'
    );
  });

  it('Umlaute prozentkodiert und Slug mit zwei Pfadteilen', () => {
    expect(movedArticlePath('/magazin/vikings-rb-jones-knie-frei-f%C3%BCr-start-N-50028887', '', map)).toBe(
      '/magazin/vikings-rb-jones-knee-cleared-to-start-0a0b0c0d'
    );
    expect(
      movedArticlePath('/magazin/tyson-bagent-clears-gehirnersch%C3%BCtterung-protokoll-/nfl639278', '', map)
    ).toBe('/magazin/tyson-bagent-clears-concussion-protocol-9f8e7d6c');
  });

  it('neue Slugs und andere Seiten bleiben', () => {
    expect(movedArticlePath('/magazin/lions-sign-db-jalen-mills-1a2b3c4d', '', map)).toBeNull();
    expect(movedArticlePath('/teams/kc', '', map)).toBeNull();
    expect(movedArticlePath('/magazin/%E0%A4%A', '', map)).toBeNull();
  });
});
