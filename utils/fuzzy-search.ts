import Fuse from 'fuse.js';
import deburr from 'lodash/deburr';

const normalize = (text: string) => deburr(text).trim().toLocaleLowerCase();

export const createFuzzySearch = <Item>({
  items,
  getSearchTerms,
}: {
  items: Item[];
  getSearchTerms: (item: Item) => string[];
}) => {
  const documents = items.map((item, order) => {
    const terms = getSearchTerms(item).map(normalize);
    return { item, order, terms, words: terms.flatMap((term) => term.split(/\s+/)) };
  });
  const fuse = new Fuse(documents, {
    keys: ['terms'],
    ignoreLocation: true,
    ignoreFieldNorm: true,
    useTokenSearch: true,
    tokenMatch: 'all',
    threshold: 0.4,
    includeScore: true,
  });

  const search = (query: string) => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return { items };

    const tokens = normalizedQuery.split(/\s+/);
    const strictTokens = tokens.filter((token) => token.length <= 2 || /\d/.test(token));
    const fuzzyTokens = tokens.filter((token) => token.length > 2 && !/\d/.test(token));
    const candidates = fuzzyTokens.length
      ? fuse.search(fuzzyTokens.join(' '))
      : documents.map((item) => ({ item, score: 0 }));
    const matches = candidates
      .filter(({ item }) =>
        strictTokens.every((token) => item.terms.some((term) => term.includes(token)))
      )
      .map(({ item, score }) => ({
        ...item,
        score: score ?? 0,
        rank: item.terms.includes(normalizedQuery)
          ? 0
          : tokens.every((token) => item.words.some((word) => word.startsWith(token)))
            ? 1
            : tokens.every((token) => item.terms.some((term) => term.includes(token)))
              ? 2
              : 3,
      }))
      .sort((a, b) =>
        a.rank !== b.rank
          ? a.rank - b.rank
          : a.rank === 3 && a.score !== b.score
            ? a.score - b.score
            : a.order - b.order
      );
    return { items: matches.map(({ item }) => item) };
  };

  return { search };
};
